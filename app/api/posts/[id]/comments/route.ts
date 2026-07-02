// app/api/posts/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../../../lib/db'

// コメント取得
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await pool.query(
      `SELECT pc.*, u.name, u.email
       FROM post_comments pc
       JOIN users u ON pc.user_id = u.id
       WHERE pc.post_id = $1
       ORDER BY pc.created_at ASC`,
      [params.id]
    )
    return NextResponse.json({ success: true, comments: result.rows })
  } catch (error) {
    console.error('コメント取得エラー:', error)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
}

// コメント投稿
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, comment } = await request.json()
    if (!userId || !comment) return NextResponse.json({ error: 'パラメータがありません' }, { status: 400 })

    const result = await pool.query(
      'INSERT INTO post_comments (post_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
      [params.id, userId, comment]
    )
    await pool.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1', [params.id])

    const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId])
    return NextResponse.json({
      success: true,
      comment: { ...result.rows[0], ...userResult.rows[0] }
    })
  } catch (error) {
    console.error('コメント投稿エラー:', error)
    return NextResponse.json({ error: '投稿に失敗しました' }, { status: 500 })
  }
}