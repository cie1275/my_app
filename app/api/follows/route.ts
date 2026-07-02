// app/api/follows/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../lib/db'

// フォロー状態取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const followerId = searchParams.get('followerId')
    const followingId = searchParams.get('followingId')

    const result = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    )
    return NextResponse.json({ success: true, following: result.rows.length > 0 })
  } catch (error) {
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
  }
}

// フォロー・アンフォロー
export async function POST(request: NextRequest) {
  try {
    const { followerId, followingId } = await request.json()

    const existing = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    )

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [followerId, followingId])
      return NextResponse.json({ success: true, following: false })
    } else {
      await pool.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)', [followerId, followingId])
      return NextResponse.json({ success: true, following: true })
    }
  } catch (error) {
    return NextResponse.json({ error: 'フォローに失敗しました' }, { status: 500 })
  }
}