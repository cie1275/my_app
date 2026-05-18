// app/api/analyze-clothes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import bedrockClient from "../../../lib/bedrock";

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, imageType, mode } = await request.json();
    // mode: "single"（服単体）or "coordinate"（コーディネート全体）

    const prompt = mode === "coordinate"
      ? `あなたはファッションの専門家です。
         このコーディネート画像に写っているすべてのアイテムを正確に認識し、
         コーディネート全体のファッション系統も分析してください。
         
         以下のルールに従ってください：
         - 必ずJSON形式のみで回答する
         - 推測が難しい場合は"不明"と回答する
         - アクセサリー類（ネックレス・指輪・時計等）も含める
         - 画像に写っていないアイテムは含めない
         - ファッション系統は複数該当する場合はすべて含める
         
         ファッション系統の例：
         カジュアル・ストリート・フェミニン・モード・ナチュラル・スポーツ・
         フォーマル・ビジネス・アウトドア・ヴィンテージ・ミニマル・ゴシック
         
         以下のJSON形式のみで回答してください：
         {
           "style": ["系統1", "系統2"],
           "items": [
             {
               "category": "カテゴリ",
               "color": "色",
               "season": "季節",
               "style": ["系統1", "系統2"],
               "confidence": "high/medium/low"
             }
           ]
         }`
      : `あなたはファッションの専門家です。
         この服の画像を正確に解析し、ファッション系統も分析してください。
         
         以下のルールに従ってください：
         - 必ずJSON形式のみで回答する
         - 推測が難しい場合は"不明"と回答する
         - 色は具体的に（例：「白」ではなく「オフホワイト」）
         - ファッション系統は複数該当する場合はすべて含める
         
         ファッション系統の例：
         カジュアル・ストリート・フェミニン・モード・ナチュラル・スポーツ・
         フォーマル・ビジネス・アウトドア・ヴィンテージ・ミニマル・ゴシック
         
         以下のJSON形式のみで回答してください：
         {
           "category": "カテゴリ",
           "color": "色",
           "season": "季節",
           "style": ["系統1", "系統2"],
           "confidence": "high/medium/low"
         }
         categoryは「トップス」「パンツ」「スカート」「アウター」「シューズ」「アクセサリー」「バッグ」のいずれか。
         seasonは「春夏」「秋冬」「オールシーズン」のいずれか。
         confidenceはAIの認識の確信度（high/medium/low）。`;

    const payload = {
      modelId: "amazon.nova-lite-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              {
                image: {
                  format: imageType.replace("image/", ""),
                  source: {
                    bytes: imageBase64,
                  },
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0.1,
        },
      }),
    };

    const command = new InvokeModelCommand(payload);
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const text = responseBody.output.message.content[0].text;

    // JSONを抽出してパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Bedrock error:", error);
    return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
  }
}