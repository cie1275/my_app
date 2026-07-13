// app/api/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../../../lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { userId } = await request.json()

    const existing = await pool.query(
      'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [id, userId]
    )

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [id, userId])
      await pool.query('UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1', [id])
      return NextResponse.json({ success: true, liked: false })
    } else {
      await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [id, userId])
      await pool.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [id])
      return NextResponse.json({ success: true, liked: true })
    }
  } catch (error) {
    console.error('いいねエラー:', error)
    return NextResponse.json({ error: 'いいねに失敗しました' }, { status: 500 })
  }
}