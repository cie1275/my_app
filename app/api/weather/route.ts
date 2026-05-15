// app/api/weather/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../../../lib/s3";

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId") ?? "380010";

    // 外部APIから天気データ取得
    const res = await fetch(
      `https://weather.tsukumijima.net/api/forecast/city/${cityId}`
    );
    const weatherData = await res.json();

    // S3への保存は待たずにバックグラウンドで実行
    const key = `weather/${cityId}_${Date.now()}.json`;
    s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(weatherData),
        ContentType: "application/json",
      })
    ).catch(err => console.error('S3保存エラー:', err));

    // S3保存を待たずにすぐ返す
    return NextResponse.json({ success: true, data: weatherData });
  } catch (error) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}