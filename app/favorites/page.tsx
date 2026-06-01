// app/favorites/page.tsx
'use client'

import { useState, useEffect } from 'react'
import BottomNav from '../../components/BottomNav'

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

type FavoriteCoord = {
  id: string
  date: string
  comment: string
  style: string[]
  image?: string
  items?: { category: string; color: string }[]
  buySuggestions?: BuySuggestion[]
  savedAt: string
  fav_id?: number
}

type FavoriteItem = {
  id: string
  image_url: string
  category?: string
  color?: string
  season?: string
  style?: string[]
  fav_id?: number
}

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<'coord' | 'item'>('coord')
  const [favCoords, setFavCoords] = useState<FavoriteCoord[]>([])
  const [favItems, setFavItems] = useState<FavoriteItem[]>([])
  const [selectedCoord, setSelectedCoord] = useState<FavoriteCoord | null>(null)

  const userId = typeof window !== 'undefined' ? localStorage.getItem('db_user_id') : null

  useEffect(() => {
    if (!userId) return
    fetchFavCoords()
    fetchFavItems()
  }, [])

  const fetchFavCoords = async () => {
    const res = await fetch(`/api/favorites?userId=${userId}&itemType=coord`)
    const json = await res.json()
    if (json.success) {
      setFavCoords(json.favorites.map((f: any) => ({ ...f.data, fav_id: f.id })))
    }
  }

  const fetchFavItems = async () => {
    const res = await fetch(`/api/favorites?userId=${userId}&itemType=item`)
    const json = await res.json()
    if (json.success) {
      setFavItems(json.favorites.map((f: any) => ({ ...f.data, fav_id: f.id })))
    }
  }

  const removeCoord = async (favId: number) => {
    await fetch(`/api/favorites?id=${favId}&userId=${userId}`, { method: 'DELETE' })
    setFavCoords(prev => prev.filter((f) => f.fav_id !== favId))
    if (selectedCoord?.fav_id === favId) setSelectedCoord(null)
  }

  const removeItem = async (favId: number) => {
    await fetch(`/api/favorites?id=${favId}&userId=${userId}`, { method: 'DELETE' })
    setFavItems(prev => prev.filter((f) => f.fav_id !== favId))
  }

  const tabStyle = (tab: 'coord' | 'item') => ({
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
      </header>

      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        <button style={tabStyle('coord')} onClick={() => setActiveTab('coord')}>👗 コーデ</button>
        <button style={tabStyle('item')} onClick={() => setActiveTab('item')}>👕 服単体</button>
      </div>

      {activeTab === 'coord' && (
        <div style={{ padding: '16px' }}>
          {favCoords.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px', color: '#CCC' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>👗</p>
              <p style={{ fontSize: '14px' }}>お気に入りのコーデがありません</p>
            </div>
          ) : (
            favCoords.map((item) => (
              <div
                key={item.fav_id}
                onClick={() => setSelectedCoord(item)}
                style={{
                  background: '#fff', borderRadius: '14px', padding: '14px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '10px',
                  cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center',
                }}
              >
                {item.image ? (
                  <img src={item.image} alt="コーデ画像" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'contain', background: '#F8F6F3', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>👗</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '11px', color: '#BBB', marginBottom: '3px' }}>{item.date}</p>
                  <p style={{ fontSize: '13px', color: '#333', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.comment}</p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {item.style?.slice(0, 2).map((s, i) => (
                      <span key={i} style={{ background: '#F0EDE8', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', color: '#7A6552' }}>{s}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeCoord(item.fav_id!) }}
                  style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', flexShrink: 0 }}
                >
                  ❤️
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'item' && (
        <div style={{ padding: '16px' }}>
          {favItems.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px', color: '#CCC' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>👕</p>
              <p style={{ fontSize: '14px' }}>お気に入りの服がありません</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {favItems.map((item) => (
                <div key={item.fav_id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt="服" style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', background: '#F8F6F3' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '1', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>👕</div>
                  )}
                  <button
                    onClick={() => removeItem(item.fav_id!)}
                    style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ❤️
                  </button>
                  <div style={{ padding: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '2px', color: '#333' }}>{item.category}</p>
                    <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '2px' }}>{item.color}・{item.season}</p>
                    <p style={{ fontSize: '10px', color: '#7A6552' }}>{item.style?.join('・')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedCoord && (
        <div onClick={() => setSelectedCoord(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', background: '#E8E8E8', borderRadius: '2px', margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#AAA' }}>{selectedCoord.date}</p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button onClick={() => removeCoord(selectedCoord.fav_id!)} style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', padding: 0 }}>❤️</button>
                <button onClick={() => setSelectedCoord(null)} style={{ border: 'none', background: '#F5F5F5', borderRadius: '50%', width: '28px', height: '28px', fontSize: '14px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

            {selectedCoord.image && (
              <img src={selectedCoord.image} alt="コーデ画像" style={{ width: '100%', borderRadius: '14px', objectFit: 'contain', maxHeight: '400px', display: 'block', background: '#F8F6F3', marginBottom: '16px' }} />
            )}

            <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.7, marginBottom: '10px' }}>{selectedCoord.comment}</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {selectedCoord.style?.map((s, i) => (
                <span key={i} style={{ background: '#1A2238', color: '#fff', borderRadius: '20px', padding: '4px 12px', fontSize: '11px' }}>{s}</span>
              ))}
            </div>

            {selectedCoord.buySuggestions && selectedCoord.buySuggestions.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '12px', letterSpacing: '0.05em' }}>購入候補</p>
                {selectedCoord.buySuggestions.map((buy, i) => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ background: '#F0EDE8', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', color: '#7A6552' }}>{buy.category}</span>
                      <span style={{ fontSize: '12px', color: '#AAA' }}>{buy.color}</span>
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