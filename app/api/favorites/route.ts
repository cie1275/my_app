// app/api/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../lib/db'

// お気に入り取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const itemType = searchParams.get('itemType')
    if (!userId) return NextResponse.json({ error: 'ユーザーIDがありません' }, { status: 400 })

    const result = await pool.query(
      'SELECT * FROM favorites WHERE user_id = $1 AND item_type = $2 ORDER BY saved_at DESC',
      [userId, itemType]
    )
    return NextResponse.json({ success: true, favorites: result.rows })
  } catch (error) {
    console.error('お気に入り取得エラー:', error)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
}

// お気に入り登録
export async function POST(request: NextRequest) {
  try {
    const { userId, itemType, itemId, data } = await request.json()
    if (!userId) return NextResponse.json({ error: 'ユーザーIDがありません' }, { status: 400 })

    const result = await pool.query(
      'INSERT INTO favorites (user_id, item_type, item_id, data) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, itemType, itemId, JSON.stringify(data)]
    )
    return NextResponse.json({ success: true, favorite: result.rows[0] })
  } catch (error) {
    console.error('お気に入り登録エラー:', error)
    return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 })
  }
}

// お気に入り削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    if (!id || !userId) return NextResponse.json({ error: 'パラメータがありません' }, { status: 400 })

    await pool.query('DELETE FROM favorites WHERE id = $1 AND user_id = $2', [id, userId])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('お気に入り削除エラー:', error)
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }
}