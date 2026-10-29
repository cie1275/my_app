// app/api/profile/setup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, name, gender, height, weight, hairStyle, preferredStyles } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDがありません' }, { status: 400 })
    }
    
    await pool.query(
      `UPDATE users SET
        name = $1,
        gender = $2,
        height = $3,
        weight = $4,
        hair_style = $5,
        preferred_styles = $6,
        profile_completed = TRUE
      WHERE id = $7`,
      [name, gender, height, weight, hairStyle, preferredStyles, userId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('プロフィール保存エラー:', error)
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }
}