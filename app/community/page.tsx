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

  const handleLike = async (post: Post, e: React.MouseEvent) => {
    e.stopPropagation()
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
      setShowNewPost(false)
      setNewPostImage(null)
      setNewPostComment('')
      setNewPostStyles([])
      fetchPosts()
    }
    setLoading(false)
  }

  const handleDelete = async (postId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/posts?id=${postId}&userId=${userId}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.id !== postId))
    setSelectedPost(null)
  }

  const getUserName = (post: Post) => post.name || post.email?.split('@')[0] || 'ユーザー'

  return (
    <main style={{ background: '#F8F8F8', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* ヘッダー */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: '#fff', borderBottom: '1px solid #F0F0F0',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <h1 style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '0.12em', color: '#1A2238', margin: 0, fontStyle: 'italic' }}>
          COLLECTION
        </h1>
        <button
          onClick={() => setShowNewPost(true)}
          style={{
            background: 'none', color: '#1A2238', border: '1.5px solid #1A2238',
            borderRadius: '20px', padding: '5px 12px',
            fontSize: '11px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          ＋ 投稿
        </button>
      </header>

      {/* タブ */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0', marginBottom: '2px' }}>
        {(['all', 'following'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px', border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1A2238' : '2px solid transparent',
              background: 'none',
              color: activeTab === tab ? '#1A2238' : '#AAA',
              fontSize: '12px', cursor: 'pointer',
              fontWeight: activeTab === tab ? '600' : '400',
              letterSpacing: '0.04em',
            }}
          >
            {tab === 'all' ? 'おすすめ' : 'フォロー中'}
          </button>
        ))}
      </div>

      {/* 投稿グリッド */}
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '80px', color: '#CCC' }}>
          <p style={{ fontSize: '36px', marginBottom: '12px' }}>👗</p>
          <p style={{ fontSize: '13px' }}>投稿がありません</p>
          <p style={{ fontSize: '11px', marginTop: '6px' }}>最初の投稿をしてみましょう</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', padding: '2px' }}>
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => handleOpenPost(post)}
              style={{ position: 'relative', cursor: 'pointer', background: '#F0EDE8', paddingBottom: '133%', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                {post.image_url ? (
                  <img src={post.image_url} alt="コーデ" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>👗</div>
                )}

                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                  padding: '20px 8px 8px',
                }}>
                  <p style={{ fontSize: '10px', color: '#fff', fontWeight: '600', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getUserName(post)}
                  </p>
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                    {post.style?.slice(0, 2).map((s, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1px 5px', fontSize: '8px', color: '#fff' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={(e) => handleLike(post, e)}
                  style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(255,255,255,0.85)', border: 'none',
                    borderRadius: '50%', width: '26px', height: '26px',
                    fontSize: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {post.liked ? '❤️' : '🤍'}
                </button>

                {String(post.user_id) === userId && (
                  <button
                    onClick={(e) => handleDelete(post.id, e)}
                    style={{
                      position: 'absolute', top: '6px', left: '6px',
                      background: 'rgba(0,0,0,0.4)', border: 'none',
                      borderRadius: '50%', width: '24px', height: '24px',
                      fontSize: '11px', cursor: 'pointer', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 投稿詳細モーダル */}
      {selectedPost && (
        <div
          onClick={() => setSelectedPost(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ width: '36px', height: '4px', background: '#E8E8E8', borderRadius: '2px', margin: '14px auto 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px 8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                👤
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#1A2238' }}>{getUserName(selectedPost)}</p>
                <p style={{ fontSize: '10px', color: '#AAA' }}>{new Date(selectedPost.created_at).toLocaleDateString('ja-JP')}</p>
              </div>
              <button onClick={() => setSelectedPost(null)} style={{ border: 'none', background: '#F5F5F5', borderRadius: '50%', width: '26px', height: '26px', fontSize: '12px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {selectedPost.image_url && (
              <img src={selectedPost.image_url} alt="コーデ" style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', background: '#F8F6F3' }} />
            )}

            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: '14px', marginBottom: '8px' }}>
                <button onClick={(e) => handleLike(selectedPost, e)} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                  <span style={{ fontSize: '18px' }}>{selectedPost.liked ? '❤️' : '🤍'}</span>
                  <span style={{ fontSize: '12px', color: '#555', fontWeight: '600' }}>{selectedPost.likes_count}</span>
                </button>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '18px' }}>💬</span>
                  <span style={{ fontSize: '12px', color: '#555', fontWeight: '600' }}>{selectedPost.comments_count}</span>
                </span>
              </div>

              <p style={{ fontSize: '12px', color: '#333', lineHeight: 1.6, marginBottom: '6px' }}>
                <span style={{ fontWeight: '600', color: '#1A2238', marginRight: '6px' }}>{getUserName(selectedPost)}</span>
                {selectedPost.comment}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                {selectedPost.style?.map((s, i) => (
                  <span key={i} style={{ background: '#F0EDE8', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', color: '#7A6552' }}>{s}</span>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '10px', marginBottom: '10px' }}>
                {comments.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#CCC', textAlign: 'center', padding: '8px 0' }}>コメントはまだありません</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>👤</div>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#1A2238', marginRight: '6px' }}>{c.name || c.email?.split('@')[0]}</span>
                        <span style={{ fontSize: '12px', color: '#333' }}>{c.comment}</span>
                        <p style={{ fontSize: '10px', color: '#CCC', marginTop: '2px' }}>{new Date(c.created_at).toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="コメントを入力..."
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1.5px solid #EEE', fontSize: '12px', outline: 'none', color: '#333' }}
                />
                <button
                  onClick={handleComment}
                  style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', background: '#1A2238', color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規投稿モーダル */}
      {showNewPost && (
        <div
          onClick={() => setShowNewPost(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '16px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}
          >
            <div style={{ width: '36px', height: '4px', background: '#E8E8E8', borderRadius: '2px', margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#1A2238' }}>コーデを投稿</p>
              <button onClick={() => setShowNewPost(false)} style={{ border: 'none', background: '#F5F5F5', borderRadius: '50%', width: '26px', height: '26px', fontSize: '12px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {newPostImage ? (
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <img src={newPostImage} alt="投稿画像" style={{ width: '100%', borderRadius: '10px', objectFit: 'contain', maxHeight: '260px', background: '#F8F6F3' }} />
                <button onClick={() => setNewPostImage(null)} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
              </div>
            ) : (
              <button
                onClick={() => imageInputRef.current?.click()}
                style={{ width: '100%', height: '120px', borderRadius: '10px', background: '#F8F6F3', border: '2px dashed #DDD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px', cursor: 'pointer', fontSize: '12px', color: '#AAA', boxSizing: 'border-box' }}
              >
                <span style={{ fontSize: '26px' }}>📷</span>
                画像を追加（任意）
              </button>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

            <textarea
              value={newPostComment}
              onChange={(e) => setNewPostComment(e.target.value)}
              placeholder="コーデの説明を入力..."
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #EEE', fontSize: '12px', outline: 'none', minHeight: '70px', resize: 'none', boxSizing: 'border-box', marginBottom: '10px', color: '#333' }}
            />

            <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '6px', letterSpacing: '0.04em' }}>スタイルタグ</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStyle(s)}
                  style={{
                    padding: '5px 10px', borderRadius: '20px',
                    border: newPostStyles.includes(s) ? 'none' : '1.5px solid #EEE',
                    background: newPostStyles.includes(s) ? '#1A2238' : '#fff',
                    color: newPostStyles.includes(s) ? '#fff' : '#555',
                    fontSize: '11px', cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && customStyle.trim()) { toggleStyle(customStyle.trim()); setCustomStyle('') } }}
                placeholder="その他のタグを追加"
                style={{ flex: 1, padding: '7px 12px', borderRadius: '20px', border: '1.5px solid #EEE', fontSize: '11px', outline: 'none' }}
              />
              <button
                onClick={() => { if (customStyle.trim()) { toggleStyle(customStyle.trim()); setCustomStyle('') } }}
                style={{ padding: '7px 12px', borderRadius: '20px', border: 'none', background: '#1A2238', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
              >
                追加
              </button>
            </div>

            <button
              onClick={handlePost}
              disabled={loading || !newPostComment.trim()}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: loading || !newPostComment.trim() ? '#CCC' : '#1A2238', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: loading || !newPostComment.trim() ? 'not-allowed' : 'pointer' }}
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