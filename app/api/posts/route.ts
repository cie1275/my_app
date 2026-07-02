// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../lib/db'

// 投稿一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'all' or 'following'

    let query = ''
    let params: any[] = []

    if (type === 'following' && userId) {
      query = `
        SELECT p.*, u.name, u.email,
          EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1) as liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = $1
        )
        ORDER BY p.created_at DESC
        LIMIT 30
      `
      params = [userId]
    } else {
      query = `
        SELECT p.*, u.name, u.email,
          ${userId ? `EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1) as liked` : 'false as liked'}
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 30
      `
      params = userId ? [userId] : []
    }

    const result = await pool.query(query, params)
    return NextResponse.json({ success: true, posts: result.rows })
  } catch (error) {
    console.error('投稿取得エラー:', error)
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
}

// 投稿作成
export async function POST(request: NextRequest) {
  try {
    const { userId, imageUrl, comment, style, outfitSuggestionId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'ユーザーIDがありません' }, { status: 400 })

    const result = await pool.query(
      `INSERT INTO posts (user_id, image_url, comment, style, outfit_suggestion_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, imageUrl, comment, style, outfitSuggestionId ?? null]
    )
    return NextResponse.json({ success: true, post: result.rows[0] })
  } catch (error) {
    console.error('投稿作成エラー:', error)
    return NextResponse.json({ error: '投稿に失敗しました' }, { status: 500 })
  }
}

// 投稿削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    if (!id || !userId) return NextResponse.json({ error: 'パラメータがありません' }, { status: 400 })

    await pool.query('DELETE FROM posts WHERE id = $1 AND user_id = $2', [id, userId])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('投稿削除エラー:', error)
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }
}