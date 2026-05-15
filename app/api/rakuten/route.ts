// app/api/rakuten/route.ts
import { NextRequest, NextResponse } from "next/server";

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") ?? "";

    const res = await fetch(
      `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?applicationId=${RAKUTEN_APP_ID}&keyword=${encodeURIComponent(keyword)}&genreId=100371&hits=6&imageFlag=1`
    );
    const data = await res.json();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}