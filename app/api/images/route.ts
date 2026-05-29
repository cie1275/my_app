// app/api/images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../../../lib/s3";

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルがありません" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const userId = request.headers.get('x-user-id') ?? 'anonymous'
    const key = `images/${userId}/${Date.now()}_${file.name}`
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ success: true, key, url });
  } catch (error) {
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}