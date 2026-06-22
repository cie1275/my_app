// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../lib/db'

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!

export async function POST(request: NextRequest) {
  try {
    const { style, items, userId } = await request.json()

    let gender = 'person'
    if (userId) {
      const result = await pool.query(
        'SELECT gender FROM users WHERE id = $1',
        [userId]
      )
      if (result.rows.length > 0) {
        const g = result.rows[0].gender
        if (g === 'レディース') gender = 'woman'
        else if (g === 'メンズ') gender = 'man'
        else gender = 'person'
      }
    }

    const styleDesc = style?.slice(0, 2).join(' ') ?? 'fashion'
    const itemDesc = items
      ?.slice(0, 2)
      .map((i: { category: string; color: string }) => `${i.color} ${i.category}`)
      .join(' ') ?? ''

    const genderQuery = gender === 'man'
      ? 'men male fashion outfit'
      : gender === 'woman'
      ? 'women female fashion outfit'
      : 'fashion outfit'

    const query = `full body ${genderQuery} ${styleDesc} ${itemDesc}`.trim()

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

    // サーバー側で画像を取得してbase64に変換
    const imageRes = await fetch(imageUrl)
    const imageBuffer = await imageRes.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')

    return NextResponse.json({
      success: true,
      image: `data:image/jpeg;base64,${base64}`,
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