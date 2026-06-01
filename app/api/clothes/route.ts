// app/api/clothes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../lib/db'

// クローゼット取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'ユーザーIDがありません' }, { status: 400 })

    const result = await pool.query(
      'SELECT * FROM clothes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return NextResponse.json({ success: true, clothes: result.rows })
  } catch (error) {
    console.error('クローゼット取得エラー:', error)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
}

// クローゼット登録
export async function POST(request: NextRequest) {
  try {
    const { userId, name, category, color, season, style, imageUrl } = await request.json()
    if (!userId) return NextResponse.json({ error: 'ユーザーIDがありません' }, { status: 400 })

    const result = await pool.query(
      'INSERT INTO clothes (user_id, name, category, color, season, style, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, name ?? category, category, color, season, style, imageUrl]
    )
    return NextResponse.json({ success: true, cloth: result.rows[0] })
  } catch (error) {
    console.error('クローゼット登録エラー:', error)
    return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 })
  }
}

// クローゼット削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    if (!id || !userId) return NextResponse.json({ error: 'パラメータがありません' }, { status: 400 })

    await pool.query('DELETE FROM clothes WHERE id = $1 AND user_id = $2', [id, userId])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('クローゼット削除エラー:', error)
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }
}