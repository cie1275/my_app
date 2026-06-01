// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    // 既存ユーザー確認
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existing.rows.length > 0) {
  return NextResponse.json({
    success: true,
    userId: existing.rows[0].id,
    profileCompleted: existing.rows[0].profile_completed ?? false,
  })
}

const result = await pool.query(
  'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id, profile_completed',
  [email, name ?? email]
)
return NextResponse.json({
  success: true,
  userId: result.rows[0].id,
  profileCompleted: result.rows[0].profile_completed ?? false,
})

  } catch (error) {
    console.error('ユーザー登録エラー:', error)
    return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 })
  }
}