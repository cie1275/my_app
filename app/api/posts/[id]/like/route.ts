// app/api/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../../../lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await request.json()
    const postId = params.id

    const existing = await pool.query(
      'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    )

    if (existing.rows.length > 0) {
      // いいね解除
      await pool.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId])
      await pool.query('UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1', [postId])
      return NextResponse.json({ success: true, liked: false })
    } else {
      // いいね追加
      await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [postId, userId])
      await pool.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [postId])
      return NextResponse.json({ success: true, liked: true })
    }
  } catch (error) {
    console.error('いいねエラー:', error)
    return NextResponse.json({ error: 'いいねに失敗しました' }, { status: 500 })
  }
}