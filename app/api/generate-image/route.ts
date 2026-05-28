// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server'

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!

export async function POST(request: NextRequest) {
  try {
    const { style, items } = await request.json()

    const styleDesc = style?.slice(0, 2).join(' ') ?? 'fashion'
    const itemDesc = items
      ?.slice(0, 2)
      .map((i: { category: string; color: string }) => `${i.color} ${i.category}`)
      .join(' ') ?? ''

    // 全身写真に絞ったクエリ
    const query = `full body ${styleDesc} ${itemDesc} outfit street fashion`.trim()

    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=portrait&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: '画像の取得に失敗しました' }, { status: 500 })
    }

    const data = await res.json()
    const imageUrl = data.urls?.regular ?? data.urls?.small

    if (!imageUrl) {
      return NextResponse.json({ error: '画像が見つかりませんでした' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      image: imageUrl,
      credit: {
        name: data.user?.name ?? '',
        link: data.links?.html ?? '',
      },
    })
  } catch (error) {
    console.error('Unsplash error:', error)
    return NextResponse.json({ error: '画像の取得に失敗しました' }, { status: 500 })
  }
}