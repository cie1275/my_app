// app/community/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import BottomNav from '../../components/BottomNav'

type Post = {
  id: number
  user_id: number
  name: string
  email: string
  image_url?: string
  comment: string
  style: string[]
  likes_count: number
  comments_count: number
  liked: boolean
  created_at: string
}

type Comment = {
  id: number
  user_id: number
  name: string
  email: string
  comment: string
  created_at: string
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostImage, setNewPostImage] = useState<string | null>(null)
  const [newPostComment, setNewPostComment] = useState('')
  const [newPostStyles, setNewPostStyles] = useState<string[]>([])
  const [customStyle, setCustomStyle] = useState('')
  const [loading, setLoading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const userId = typeof window !== 'undefined' ? localStorage.getItem('db_user_id') : null

  const STYLE_OPTIONS = ['カジュアル', 'ストリート', 'フェミニン', 'モード', 'ナチュラル', '韓国系', 'アメカジ', 'スポーツ']

  useEffect(() => {
    fetchPosts()
  }, [activeTab])

  const fetchPosts = async () => {
    const res = await fetch(`/api/posts?userId=${userId}&type=${activeTab}`)
    const json = await res.json()
    if (json.success) setPosts(json.posts)
  }

  const handleLike = async (post: Post) => {
    const res = await fetch(`/api/posts/${post.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const json = await res.json()
    if (json.success) {
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, liked: json.liked, likes_count: p.likes_count + (json.liked ? 1 : -1) }
          : p
      ))
      if (selectedPost?.id === post.id) {
        setSelectedPost(prev => prev ? {
          ...prev, liked: json.liked,
          likes_count: prev.likes_count + (json.liked ? 1 : -1)
        } : null)
      }
    }
  }

  const handleOpenPost = async (post: Post) => {
    setSelectedPost(post)
    const res = await fetch(`/api/posts/${post.id}/comments`)
    const json = await res.json()
    if (json.success) setComments(json.comments)
  }

  const handleComment = async () => {
    if (!newComment.trim() || !selectedPost) return
    const res = await fetch(`/api/posts/${selectedPost.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, comment: newComment }),
    })
    const json = await res.json()
    if (json.success) {
      setComments(prev => [...prev, json.comment])
      setPosts(prev => prev.map(p =>
        p.id === selectedPost.id ? { ...p, comments_count: p.comments_count + 1 } : p
      ))
      setNewComment('')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setNewPostImage(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const toggleStyle = (style: string) => {
    setNewPostStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    )
  }

  const handlePost = async () => {
    if (!newPostComment.trim()) return
    setLoading(true)
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        imageUrl: newPostImage,
        comment: newPostComment,
        style: newPostStyles,
      }),
    })
    const json = await res.json()
    if (json.success) {
      setPosts(prev => [{ ...json.post, liked: false, name: '', email: '' }, ...prev])
      setShowNewPost(false)
      setNewPostImage(null)
      setNewPostComment('')
      setNewPostStyles([])
      fetchPosts()
    }
    setLoading(false)
  }

  const handleDelete = async (postId: number) => {
    await fetch(`/api/posts?id=${postId}&userId=${userId}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.id !== postId))
    setSelectedPost(null)
  }

  const getUserName = (post: Post) => post.name || post.email?.split('@')[0] || 'ユーザー'

  const tabStyle = (tab: 'all' | 'following') => ({
    flex: 1,
    padding: '10px',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #1A2238' : '2px solid #F0F0F0',
    background: 'none',
    color: activeTab === tab ? '#1A2238' : '#AAA',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: activeTab === tab ? ('600' as const) : ('400' as const),
  })

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 12px', background: '#fff', borderBottom: '1px solid #F0F0F0',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.12em', color: '#1A2238', margin: 0, fontStyle: 'italic' }}>
          L'Atelier
        </h1>
        <button
          onClick={() => setShowNewPost(true)}
          style={{
            background: '#1A2238', color: '#fff', border: 'none',
            borderRadius: '20px', padding: '8px 16px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          ＋ 投稿
        </button>
      </header>

      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        <button style={tabStyle('all')} onClick={() => setActiveTab('all')}>おすすめ</button>
        <button style={tabStyle('following')} onClick={() => setActiveTab('following')}>フォロー中</button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px', color: '#CCC' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>👗</p>
            <p style={{ fontSize: '14px' }}>投稿がありません</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                background: '#fff', borderRadius: '14px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
              }}
            >
              {/* ユーザー情報 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px 8px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: '#F0EDE8', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                }}>
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A2238' }}>{getUserName(post)}</p>
                  <p style={{ fontSize: '11px', color: '#AAA' }}>
                    {new Date(post.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                {String(post.user_id) === userId && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', color: '#CCC' }}
                  >
                    🗑️
                  </button>
                )}
              </div>

              {/* 画像 */}
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="コーデ"
                  onClick={() => handleOpenPost(post)}
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: '#F8F6F3', cursor: 'pointer' }}
                />
              )}

              {/* コメント・スタイル */}
              <div style={{ padding: '10px 14px' }}>
                <p style={{ fontSize: '13px', color: '#333', lineHeight: 1.6, marginBottom: '8px' }}>
                  {post.comment}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                  {post.style?.map((s, i) => (
                    <span key={i} style={{
                      background: '#F0EDE8', borderRadius: '20px', padding: '2px 10px',
                      fontSize: '11px', color: '#7A6552',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>

                {/* いいね・コメント */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleLike(post)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                  >
                    <span style={{ fontSize: '18px' }}>{post.liked ? '❤️' : '🤍'}</span>
                    <span style={{ fontSize: '13px', color: '#AAA' }}>{post.likes_count}</span>
                  </button>
                  <button
                    onClick={() => handleOpenPost(post)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                  >
                    <span style={{ fontSize: '18px' }}>💬</span>
                    <span style={{ fontSize: '13px', color: '#AAA' }}>{post.comments_count}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 投稿詳細モーダル */}
      {selectedPost && (
        <div
          onClick={() => setSelectedPost(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div style={{ width: '36px', height: '4px', background: '#E8E8E8', borderRadius: '2px', margin: '0 auto 16px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                👤
              </div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A2238' }}>{getUserName(selectedPost)}</p>
            </div>

            {selectedPost.image_url && (
              <img src={selectedPost.image_url} alt="コーデ" style={{ width: '100%', borderRadius: '12px', objectFit: 'contain', maxHeight: '300px', background: '#F8F6F3', marginBottom: '12px' }} />
            )}

            <p style={{ fontSize: '13px', color: '#333', lineHeight: 1.6, marginBottom: '8px' }}>{selectedPost.comment}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
              {selectedPost.style?.map((s, i) => (
                <span key={i} style={{ background: '#F0EDE8', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', color: '#7A6552' }}>{s}</span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <button onClick={() => handleLike(selectedPost)} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                <span style={{ fontSize: '20px' }}>{selectedPost.liked ? '❤️' : '🤍'}</span>
                <span style={{ fontSize: '13px', color: '#AAA' }}>{selectedPost.likes_count}</span>
              </button>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '20px' }}>💬</span>
                <span style={{ fontSize: '13px', color: '#AAA' }}>{selectedPost.comments_count}</span>
              </span>
            </div>

            {/* コメント一覧 */}
            <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '12px', marginBottom: '12px' }}>
              {comments.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#CCC', textAlign: 'center', padding: '12px 0' }}>コメントはまだありません</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>👤</div>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#1A2238', marginBottom: '2px' }}>{c.name || c.email?.split('@')[0]}</p>
                      <p style={{ fontSize: '13px', color: '#333' }}>{c.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* コメント入力 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                placeholder="コメントを入力..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1.5px solid #EEE', fontSize: '13px', outline: 'none' }}
              />
              <button
                onClick={handleComment}
                style={{ padding: '10px 16px', borderRadius: '20px', border: 'none', background: '#1A2238', color: '#fff', fontSize: '13px', cursor: 'pointer' }}
              >
                送信
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新規投稿モーダル */}
      {showNewPost && (
        <div
          onClick={() => setShowNewPost(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ width: '36px', height: '4px', background: '#E8E8E8', borderRadius: '2px', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1A2238', marginBottom: '16px' }}>コーデを投稿</p>

            {/* 画像アップロード */}
            {newPostImage ? (
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <img src={newPostImage} alt="投稿画像" style={{ width: '100%', borderRadius: '12px', objectFit: 'contain', maxHeight: '300px', background: '#F8F6F3' }} />
                <button
                  onClick={() => setNewPostImage(null)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', fontSize: '12px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => imageInputRef.current?.click()}
                style={{ width: '100%', height: '140px', borderRadius: '12px', background: '#F8F6F3', border: '2px dashed #DDD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer', fontSize: '13px', color: '#AAA' }}
              >
                <span style={{ fontSize: '28px' }}>📷</span>画像を追加
              </button>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

            {/* コメント入力 */}
            <textarea
              value={newPostComment}
              onChange={(e) => setNewPostComment(e.target.value)}
              placeholder="コーデの説明を入力..."
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #EEE', fontSize: '13px', outline: 'none', minHeight: '80px', resize: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
            />

            {/* スタイル選択 */}
            <p style={{ fontSize: '12px', color: '#AAA', marginBottom: '8px' }}>スタイルタグ</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStyle(s)}
                  style={{
                    padding: '6px 12px', borderRadius: '20px',
                    border: newPostStyles.includes(s) ? 'none' : '1.5px solid #EEE',
                    background: newPostStyles.includes(s) ? '#1A2238' : '#fff',
                    color: newPostStyles.includes(s) ? '#fff' : '#555',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customStyle.trim()) {
                    toggleStyle(customStyle.trim())
                    setCustomStyle('')
                  }
                }}
                placeholder="その他のタグを追加"
                style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1.5px solid #EEE', fontSize: '12px', outline: 'none' }}
              />
              <button
                onClick={() => { if (customStyle.trim()) { toggleStyle(customStyle.trim()); setCustomStyle('') } }}
                style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', background: '#1A2238', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
              >
                追加
              </button>
            </div>

            <button
              onClick={handlePost}
              disabled={loading || !newPostComment.trim()}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: loading || !newPostComment.trim() ? '#CCC' : '#1A2238', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: loading || !newPostComment.trim() ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  )
}