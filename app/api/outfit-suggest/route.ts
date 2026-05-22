// app/api/outfit-suggest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import bedrockClient from "../../../lib/bedrock";

const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID!;

export async function POST(request: NextRequest) {
  try {
    const { weather, temperature, clothes, totalBudget, itemBudget } = await request.json();

    // アイテムごとの予算を自動計算
    const autoItemBudget = itemBudget
      ? itemBudget
      : totalBudget
      ? Math.floor(totalBudget / 4) // 全体予算を4アイテムで割る
      : null

    const prompt = `あなたはファッションの専門家です。
      以下の天気と気温に合わせた服装とアクセサリーを提案してください。
      
      天気：${weather}
      気温：${temperature}℃
      ${totalBudget ? `全体の予算上限：${totalBudget}円（この金額を絶対に超えないこと）` : ''}
      ${autoItemBudget ? `アイテムごとの予算上限：${autoItemBudget}円（この金額を絶対に超えないこと）` : ''}
      
      ユーザーが持っている服：
      ${JSON.stringify(clothes, null, 2)}
      
      以下のルールに従ってください：
      - 持っている服を優先的に使ったコーディネートを提案する
      - 足りないアイテムは購入候補として提案する
      - アクセサリー（ネックレス・ブレスレット・リング・ピアス・時計・ベルト・帽子・スカーフ等）も必ず提案する
      - ファッション系統を考慮する
      - コーディネート全体のバランスを考慮する
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