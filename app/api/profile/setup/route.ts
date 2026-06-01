// app/api/profile/setup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, gender, height, weight, hairStyle, preferredStyles } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDがありません' }, { status: 400 })
    }

    await pool.query(
      `UPDATE users SET
        gender = $1,
        height = $2,
        weight = $3,
        hair_style = $4,
        preferred_styles = $5,
        profile_completed = TRUE
      WHERE id = $6`,
      [gender, height, weight, hairStyle, preferredStyles, userId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('プロフィール保存エラー:', error)
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }
}