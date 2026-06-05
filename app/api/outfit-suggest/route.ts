// app/api/outfit-suggest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import bedrockClient from "../../../lib/bedrock";
import pool from '../../../lib/db';

const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID!;

export async function POST(request: NextRequest) {
  try {
    const { weather, temperature, clothes, totalBudget, itemBudget, userId } = await request.json()

// プロフィール取得
      let profile: any = null
      if (userId) {
        const result = await pool.query(
        'SELECT gender, height, weight, hair_style, preferred_styles FROM users WHERE id = $1',
        [userId]
      )
      if (result.rows.length > 0) profile = result.rows[0]
    }

    // アイテムごとの予算を自動計算
    const autoItemBudget = itemBudget
      ? itemBudget
      : totalBudget
      ? Math.floor(totalBudget / 4) // 全体予算を4アイテムで割る
      : null

    const prompt = `あなたはファッションの専門家です。
      以下のユーザー情報・天気・気温に合わせた服装とアクセサリーを提案してください。

      【ユーザー情報】
      ${profile?.gender ? `性別：${profile.gender}` : ''}
      ${profile?.height ? `身長：${profile.height}cm` : ''}
      ${profile?.weight ? `体重：${profile.weight}kg` : ''}
      ${profile?.hair_style ? `髪型：${profile.hair_style}` : ''}
      ${profile?.preferred_styles?.length ? `好みの系統：${profile.preferred_styles.join('・')}` : ''}
      
      天気：${weather}
      気温：${temperature}℃
      ${totalBudget ? `全体の予算上限：${totalBudget}円（この金額を絶対に超えないこと）` : ''}
      ${autoItemBudget ? `アイテムごとの予算上限：${autoItemBudget}円（この金額を絶対に超えないこと）` : ''}
      
      ユーザーが持っている服：
      ${JSON.stringify(clothes, null, 2)}
      
      以下のルールに従ってください：
      - 【最重要】ユーザーの性別（${profile?.gender ?? '不明'}）に合った服装のみを提案する。メンズの場合は絶対に女性向けアイテム（スカート・ワンピース・レディース専用アイテム等）を提案しない
      - クローゼットの服を分析し、天気・気温・ユーザーの好みの系統に合うものを優先的に使う
      - クローゼットの服だけでコーディネートが完成する場合は購入候補を最小限にする
      - クローゼットの服では不足しているアイテム、またはコーディネートをより良くできるアイテムのみ購入候補として提案する
      - 購入候補はクローゼットにない種類のアイテムを優先する（すでに持っている種類は提案しない）
      - アクセサリーはユーザーの性別に合ったもののみ提案する
      - ユーザーの好みの系統・性別・身長・体重・髪型を考慮してコーディネートを提案する
      - コーディネート全体のバランスとユーザーのスタイルを考慮する
      ${totalBudget ? `- 購入候補の合計金額が必ず${totalBudget}円以内になるように提案する` : ''}
      ${autoItemBudget ? `- 各アイテムのestimated_priceは必ず${autoItemBudget}円以下にする` : ''}
      - 必ずJSON形式のみで回答する
      
      以下のJSON形式のみで回答してください：
      {
        "comment": "全体のコーディネートコメント",
        "style": ["提案する系統"],
        "total_budget": 購入候補の合計予算（数値）,
        "use_clothes": [
          {
            "id": "服のID",
            "category": "カテゴリ",
            "reason": "選んだ理由"
          }
        ],
        "buy_suggestions": [
          {
            "category": "カテゴリ（服・アクセサリー等）",
            "color": "色",
            "keyword": "Yahoo!ショッピング検索キーワード",
            "reason": "必要な理由",
            "type": "clothes or accessory",
            "estimated_price": 予算目安（数値・必ず${autoItemBudget ?? totalBudget ?? 99999}円以下）
          }
        ]
      }`;

    const command = new InvokeModelCommand({
      modelId: "amazon.nova-lite-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [{ text: prompt }],
          },
        ],
        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0.3,
        },
      }),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const text = responseBody.output.message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const suggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    // Yahoo!ショッピングAPIで購入候補を検索
    const yahooItems = await Promise.all(
      (suggestion?.buy_suggestions ?? []).map(async (item: {
        keyword: string
        category: string
        color: string
        reason: string
        type: string
        estimated_price: number
      }) => {
        // 価格フィルターを設定
        const maxPrice = autoItemBudget ?? item.estimated_price ?? null
        const priceParam = maxPrice ? `&price_to=${maxPrice}` : ''

        const res = await fetch(
          `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${YAHOO_CLIENT_ID}&query=${encodeURIComponent(item.keyword)}&results=3&image_size=200${priceParam}&sort=-score`
        );
        const data = await res.json();

        // 予算内の商品のみフィルタリング
        const filteredItems = (data.hits ?? [])
          .filter((i: any) => !maxPrice || i.price <= maxPrice)
          .slice(0, 3)
          .map((i: any) => ({
            name: i.name,
            price: i.price,
            url: i.url,
            image: i.image?.medium,
          }))

        return {
          ...item,
          rakuten: filteredItems,
        };
      })
    );

    return NextResponse.json({
      success: true,
      suggestion: {
        ...suggestion,
        buy_suggestions: yahooItems,
      },
    });
  } catch (error) {
    console.error("Outfit suggest error:", error);
    return NextResponse.json({ error: "提案に失敗しました" }, { status: 500 });
  }
}