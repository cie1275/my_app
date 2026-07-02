// app/coorde/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import BottomNav from '../../components/BottomNav'
import OutfitSuggest from '../../components/OutfitSuggest'

type YahooItem = {
  name: string
  price: number
  url: string
  image: string
}

type BuySuggestion = {
  category: string
  color: string
  keyword: string
  reason: string
  type: string
  rakuten: YahooItem[]
}

type HistoryItem = {
  id: string
  date: string
  comment: string
  style: string[]
  image?: string
  items?: { category: string; color: string }[]
  buySuggestions?: BuySuggestion[]
}

type FavoriteCoord = HistoryItem & { savedAt: string; fav_id?: number }

type ClothItem = {
  id: string
  category: string
  color: string
  season: string
  style: string[]
}

export default function CoordePage() {
  const [activeTab, setActiveTab] = useState<'suggest' | 'history'>('suggest')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [favCoords, setFavCoords] = useState<FavoriteCoord[]>([])
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [postedIds, setPostedIds] = useState<string[]>([])
  const [closetClothes, setClosetClothes] = useState<ClothItem[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  const userId = typeof window !== 'undefined' ? localStorage.getItem('db_user_id') : null

  useEffect(() => {
    if (!userId) return
    fetchHistory()
    fetchFavorites()
    fetchCloset()
  }, [])

  const fetchHistory = async () => {
    const res = await fetch(`/api/outfit-history?userId=${userId}`)
    const json = await res.json()
    if (json.success) {
      setHistory(json.history.map((h: any) => ({
        id: String(h.id),
        date: new Date(h.created_at).toLocaleDateString('ja-JP'),
        comment: h.comment,
        style: h.style ?? [],
        image: h.image_url,
        items: h.suggestion ? JSON.parse(h.suggestion) : [],
        buySuggestions: h.rakuten_items ?? [],
      })))
    }
  }

  const fetchFavorites = async () => {
    const res = await fetch(`/api/favorites?userId=${userId}&itemType=coord`)
    const json = await res.json()
    if (json.success) {
      setFavCoords(json.favorites.map((f: any) => ({
        ...f.data,
        fav_id: f.id,
      })))
    }
  }

  const fetchCloset = async () => {
    const res = await fetch(`/api/clothes?userId=${userId}`)
    const json = await res.json()
    if (json.success) setClosetClothes(json.clothes)
  }

  const isFavorited = (id: string) => favCoords.some((f) => f.id === id)

  const toggleFavorite = async (item: HistoryItem) => {
    if (isFavorited(item.id)) {
      const fav = favCoords.find((f) => f.id === item.id)
      if (!fav?.fav_id) return
      await fetch(`/api/favorites?id=${fav.fav_id}&userId=${userId}`, { method: 'DELETE' })
      setFavCoords(prev => prev.filter((f) => f.id !== item.id))
    } else {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          itemType: 'coord',
          itemId: item.id,
          data: item,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFavCoords(prev => [...prev, { ...item, savedAt: new Date().toISOString(), fav_id: json.favorite.id }])
      }
    }
  }

  const handleSuggestionComplete = async (
    comment: string,
    style: string[],
    image?: string,
    items?: { category: string; color: string }[],
    buySuggestions?: BuySuggestion[]
  ) => {
    if (!userId) return
    const res = await fetch('/api/outfit-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        comment,
        style,
        imageUrl: image,
        rakutenItems: buySuggestions,
        suggestion: JSON.stringify(items),
      }),
    })
    const json = await res.json()
    if (json.success) {
      const newItem: HistoryItem = {
        id: String(json.history.id),
        date: new Date().toLocaleDateString('ja-JP'),
        comment,
        style,
        image,
        items,
        buySuggestions,
      }
      setHistory(prev => [newItem, ...prev])
    }
  }

  const handleAddImage = async (file: File) => {
    if (!selectedItem) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      setSelectedItem({ ...selectedItem, image: base64 })
      setHistory(prev => prev.map(h => h.id === selectedItem.id ? { ...h, image: base64 } : h))
    }
    reader.readAsDataURL(file)
  }

  const handlePost = async (item: HistoryItem) => {
  if (postedIds.includes(item.id)) return  // 投稿済みはスキップ
  setPostedIds(prev => [...prev, item.id]) // 先に追加してボタンを無効化

  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      imageUrl: item.image,
      comment: item.comment,
      style: item.style,
      outfitSuggestionId: item.id,
    }),
  })
  const json = await res.json()
  if (!json.success) {
    setPostedIds(prev => prev.filter(id => id !== item.id)) // 失敗したら戻す
  }
}

  const handleDelete = async (id: string) => {
    await fetch(`/api/outfit-history?id=${id}&userId=${userId}`, { method: 'DELETE' })
    setHistory(prev => prev.filter((h) => h.id !== id))
    setDeleteTargetId(null)
    if (selectedItem?.id === id) setSelectedItem(null)
  }

  const tabStyle = (tab: 'suggest' | 'history') => ({
    flex: 1,
    padding: '10px',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #1A2238' : '2px solid #F0F0F0',
    background: 'none',
    color: activeTab === tab ? '#1A2238' : '#AAA',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: activeTab === tab ? ('600' as const) : ('400' as const),
    letterSpacing: '0.04em',
    transition: 'all 0.2s',
  })

  return (
    <main style={{
      background: '#FAFAFA', height: '100vh',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 12px', background: '#fff',
        borderBottom: '1px solid #F0F0F0', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.12em', color: '#1A2238', margin: 0 }}>
          L'Atelier
        </h1>
      </header>

      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0', flexShrink: 0 }}>
        <button style={tabStyle('suggest')} onClick={() => setActiveTab('suggest')}>服装提案</button>
        <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>コーデ履歴</button>
      </div>

      {activeTab === 'suggest' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: '56px' }}>
          <OutfitSuggest
            weather=""
            temperature=""
            clothes={closetClothes}
            onSuggestionComplete={handleSuggestionComplete}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '80px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px', color: '#CCC' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>👗</p>
              <p style={{ fontSize: '14px' }}>コーデ履歴がありません</p>
              <p style={{ fontSize: '12px', marginTop: '6px' }}>服装提案タブからコーデを保存しましょう</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  background: '#fff', borderRadius: '14px', padding: '14px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '10px',
                  cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center',
                }}
              >
                {item.image ? (
                  <img src={item.image} alt="コーデ画像"
                    style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'contain', background: '#F8F6F3', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '10px',
                    background: '#F0EDE8', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '22px', flexShrink: 0,
                  }}>👗</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '11px', color: '#BBB', marginBottom: '3px' }}>{item.date}</p>
                  <p style={{ fontSize: '13px', color: '#333', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.comment}
                  </p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {item.style?.slice(0, 2).map((s, i) => (
                      <span key={i} style={{ background: '#F0EDE8', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', color: '#7A6552' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <span onClick={(e) => { e.stopPropagation(); toggleFavorite(item) }} style={{ fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>
                    {isFavorited(item.id) ? '❤️' : '🤍'}
                  </span>
                  <span
                    onClick={(e) => { e.stopPropagation(); handlePost(item) }}
                    style={{ fontSize: '16px', cursor: postedIds.includes(item.id) ? 'default' : 'pointer', lineHeight: 1, opacity: postedIds.includes(item.id) ? 0.4 : 1 }}
                    title={postedIds.includes(item.id) ? '投稿済み' : 'コミュニティに投稿'}
                  >
                    {postedIds.includes(item.id) ? '✅' : '📤'}
                  </span>
                  <span onClick={(e) => { e.stopPropagation(); setDeleteTargetId(item.id) }} style={{ fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}>
                    🗑️
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {deleteTargetId && (
        <div onClick={() => setDeleteTargetId(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '28px 24px', width: '280px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1A2238', marginBottom: '8px' }}>コーデを削除しますか？</p>
            <p style={{ fontSize: '13px', color: '#AAA', marginBottom: '24px' }}>この操作は取り消せません</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteTargetId(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #EEE', background: '#fff', fontSize: '14px', cursor: 'pointer', color: '#555' }}>キャンセル</button>
              <button onClick={() => handleDelete(deleteTargetId)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#C0392B', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>削除する</button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div onClick={() => setSelectedItem(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', background: '#E8E8E8', borderRadius: '2px', margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#AAA' }}>{selectedItem.date}</p>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <button onClick={() => { toggleFavorite(selectedItem); setSelectedItem({ ...selectedItem }) }} style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', padding: 0 }}>
                  {isFavorited(selectedItem.id) ? '❤️' : '🤍'}
                </button>
                <button
                  onClick={() => { handlePost(selectedItem); setSelectedItem(null) }}
                  disabled={postedIds.includes(selectedItem.id)}
                  style={{ border: 'none', background: 'none', fontSize: '20px', cursor: postedIds.includes(selectedItem.id) ? 'default' : 'pointer', padding: 0, opacity: postedIds.includes(selectedItem.id) ? 0.4 : 1 }}
                  title={postedIds.includes(selectedItem.id) ? '投稿済み' : 'コミュニティに投稿'}
                >
                  {postedIds.includes(selectedItem.id) ? '✅' : '📤'}
                </button>
                <button onClick={() => { setSelectedItem(null); setDeleteTargetId(selectedItem.id) }} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', padding: 0 }}>🗑️</button>
                <button onClick={() => setSelectedItem(null)} style={{ border: 'none', background: '#F5F5F5', borderRadius: '50%', width: '28px', height: '28px', fontSize: '14px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

            {selectedItem.image ? (
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <img src={selectedItem.image} alt="コーデ画像" style={{ width: '100%', borderRadius: '14px', objectFit: 'contain', maxHeight: '400px', display: 'block', background: '#F8F6F3' }} />
                <button onClick={() => imageInputRef.current?.click()} style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>📷 変更</button>
              </div>
            ) : (
              <button onClick={() => imageInputRef.current?.click()} style={{ width: '100%', height: '140px', borderRadius: '14px', background: '#F8F6F3', border: '2px dashed #DDD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer', fontSize: '13px', color: '#AAA' }}>
                <span style={{ fontSize: '28px' }}>📷</span>コーデ画像を追加
              </button>
            )}

            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAddImage(file); e.target.value = '' }} />

            <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.7, marginBottom: '10px' }}>{selectedItem.comment}</p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {selectedItem.style?.map((s, i) => (
                <span key={i} style={{ background: '#1A2238', color: '#fff', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', letterSpacing: '0.04em' }}>{s}</span>
              ))}
            </div>

            {selectedItem.items && selectedItem.items.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '10px', letterSpacing: '0.05em' }}>アイテム</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedItem.items.map((i, j) => (
                    <span key={j} style={{ background: '#F0EDE8', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#7A6552' }}>
                      {i.category}（{i.color}）
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.buySuggestions && selectedItem.buySuggestions.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '12px', letterSpacing: '0.05em' }}>購入候補</p>
                {selectedItem.buySuggestions.map((buy, i) => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ background: '#F0EDE8', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', color: '#7A6552' }}>{buy.category}</span>
                      <span style={{ fontSize: '12px', color: '#AAA' }}>{buy.color}</span>
                      {buy.type === 'accessory' && <span>💍</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#AAA', marginBottom: '8px' }}>{buy.reason}</p>
                    {buy.rakuten?.map((r, j) => (
                      <a key={j} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'flex', gap: '12px', padding: '10px', marginBottom: '8px', border: '1px solid #F0F0F0', borderRadius: '10px', alignItems: 'center' }}>
                          {r.image && <img src={r.image} alt={r.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '12px', color: '#333', marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.name}</p>
                            <p style={{ fontSize: '13px', color: '#C0392B', fontWeight: '700' }}>¥{r.price.toLocaleString()}</p>
                          </div>
                          <span style={{ color: '#CCC', fontSize: '18px' }}>›</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  )
}