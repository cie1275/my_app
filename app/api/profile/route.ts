// app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDがありません' }, { status: 400 })
    }

    const result = await pool.query(
      'SELECT email, gender, height, weight, hair_style, preferred_styles FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ success: true, profile: result.rows[0] })
  } catch (error) {
    console.error('プロフィール取得エラー:', error)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
}