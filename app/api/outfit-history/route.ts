// app/api/outfit-history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../lib/db'

// コーデ履歴取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'ユーザーIDがありません' }, { status: 400 })

    const result = await pool.query(
      'SELECT * FROM outfit_suggestions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return NextResponse.json({ success: true, history: result.rows })
  } catch (error) {
    console.error('コーデ履歴取得エラー:', error)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
}

// コーデ履歴保存
export async function POST(request: NextRequest) {
  try {
    const { userId, comment, style, imageUrl, weather, temperature, rakutenItems } = await request.json()
    if (!userId) return NextResponse.json({ error: 'ユーザーIDがありません' }, { status: 400 })

    const result = await pool.query(
      `INSERT INTO outfit_suggestions 
        (user_id, comment, style, image_url, weather, temperature, rakuten_items)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, comment, style, imageUrl, weather, temperature, JSON.stringify(rakutenItems)]
    )
    return NextResponse.json({ success: true, history: result.rows[0] })
  } catch (error) {
    console.error('コーデ履歴保存エラー:', error)
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }
}

// コーデ履歴削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    if (!id || !userId) return NextResponse.json({ error: 'パラメータがありません' }, { status: 400 })

    await pool.query('DELETE FROM outfit_suggestions WHERE id = $1 AND user_id = $2', [id, userId])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('コーデ履歴削除エラー:', error)
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }
}