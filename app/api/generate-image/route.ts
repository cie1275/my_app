// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../lib/db'

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

    const styleDesc = style?.slice(0, 2).join(', ') ?? 'casual'
    const itemDesc = items
      ?.slice(0, 3)
      .map((i: { category: string; color: string }) => `${i.color} ${i.category}`)
      .join(', ') ?? ''

    const prompt = `full body fashion photo of a ${gender}, wearing ${itemDesc}, ${styleDesc} style, white background, studio lighting, high quality, fashion magazine`
    const negativePrompt = 'bad quality, blurry, distorted, ugly, deformed, watermark, text'

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=768&nologo=true&seed=${Math.floor(Math.random() * 100000)}&model=turbo`
    // 30秒でタイムアウト
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const imageRes = await fetch(imageUrl, { signal: controller.signal })
      clearTimeout(timeout)

      console.log('Pollinations status:', imageRes.status)
      console.log('Pollinations content-type:', imageRes.headers.get('content-type'))

      const imageBuffer = await imageRes.arrayBuffer()
      console.log('Buffer size:', imageBuffer.byteLength)
      const base64 = Buffer.from(imageBuffer).toString('base64')

      return NextResponse.json({
        success: true,
        image: `data:image/jpeg;base64,${base64}`,
      })
    } catch (fetchError: any) {
      clearTimeout(timeout)
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'timeout',
          message: '画像の生成に時間がかかりすぎました。再度提案ボタンを押してみてください。',
        }, { status: 408 })
      }
      throw fetchError
    }
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: '画像生成に失敗しました' }, { status: 500 })
  }
}