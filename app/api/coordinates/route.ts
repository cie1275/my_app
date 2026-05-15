// app/api/coordinates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../../../lib/s3";

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

// 座標データをS3に保存
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { latitude, longitude, timestamp } = data;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "座標データがありません" },
        { status: 400 }
      );
    }

    const key = `coordinates/${Date.now()}.json`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify({ latitude, longitude, timestamp }),
        ContentType: "application/json",
      })
    );

    return NextResponse.json({ success: true, key });
  } catch (error) {
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}