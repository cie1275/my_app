// app/api/shopping/route.ts
import { NextRequest, NextResponse } from "next/server";

const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") ?? "";

    const res = await fetch(
      `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${YAHOO_CLIENT_ID}&query=${encodeURIComponent(keyword)}&results=3&image_size=200`,
    );
    const data = await res.json();
    console.log('Yahoo!ショッピングAPIレスポンス:', JSON.stringify(data).slice(0, 500));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}