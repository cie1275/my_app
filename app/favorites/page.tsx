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
}

type FavoriteItem = {
  id: string
  savedAt: string
  image: string
  category?: string
  color?: string
  season?: string
  style?: string[]
}

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<'coord' | 'item'>('coord')
  const [favCoords, setFavCoords] = useState<FavoriteCoord[]>([])
  const [favItems, setFavItems] = useState<FavoriteItem[]>([])
  const [selectedCoord, setSelectedCoord] = useState<FavoriteCoord | null>(null)

  useEffect(() => {
    const coords = localStorage.getItem('favorites_coord')
    if (coords) setFavCoords(JSON.parse(coords))
    const items = localStorage.getItem('favorites_item')
    if (items) setFavItems(JSON.parse(items))
  }, [])

  const removeCoord = (id: string) => {
    const updated = favCoords.filter((f) => f.id !== id)
    setFavCoords(updated)
    localStorage.setItem('favorites_coord', JSON.stringify(updated))
    if (selectedCoord?.id === id) setSelectedCoord(null)
  }

  const removeItem = (id: string) => {
    const updated = favItems.filter((f) => f.id !== id)
    setFavItems(updated)
    localStorage.setItem('favorites_item', JSON.stringify(updated))
  }

  const tabStyle = (tab: 'coord' | 'item') => ({
    flex: 1,
    padding: '10px',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #e74c3c' : '2px solid #eee',
    background: 'none',
    color: activeTab === tab ? '#e74c3c' : '#888',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: activeTab === tab ? ('bold' as const) : ('normal' as const),
  })

  return (
    <main style={{ paddingBottom: '100px' }}>
      <h1 style={{ padding: '16px', fontSize: '18px', margin: 0 }}>❤️ お気に入り</h1>

      <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
        <button style={tabStyle('coord')} onClick={() => setActiveTab('coord')}>
          👗 コーデ
        </button>
        <button style={tabStyle('item')} onClick={() => setActiveTab('item')}>
          👕 服単体
        </button>
      </div>

      {/* コーデお気に入り */}
      {activeTab === 'coord' && (
        <div style={{ padding: '16px' }}>
          {favCoords.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', marginTop: '32px' }}>
              お気に入りのコーデがありません
            </p>
          ) : (
            favCoords.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedCoord(item)}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt="コーデ画像"
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '8px',
                    background: '#f0f0f0', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '24px', flexShrink: 0,
                  }}>
                    👗
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>{item.date}</p>
                  <p style={{
                    fontSize: '13px', marginBottom: '4px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.comment}
                  </p>
                  <p style={{ fontSize: '11px', color: '#3498db' }}>{item.style?.join('・')}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeCoord(item.id) }}
                  style={{
                    border: 'none', background: 'none',
                    fontSize: '20px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  ❤️
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 服単体お気に入り */}
      {activeTab === 'item' && (
        <div style={{ padding: '16px' }}>
          {favItems.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', marginTop: '32px' }}>
              お気に入りの服がありません
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {favItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative',
                  }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt="服"
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', aspectRatio: '1', background: '#f0f0f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
                    }}>
                      👕
                    </div>
                  )}
                  {/* お気に入り解除ボタン */}
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      position: 'absolute', top: '6px', right: '6px',
                      background: 'rgba(255,255,255,0.85)', border: 'none',
                      borderRadius: '50%', width: '28px', height: '28px',
                      fontSize: '14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    ❤️
                  </button>
                  <div style={{ padding: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>
                      {item.category}
                    </p>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>
                      {item.color}・{item.season}
                    </p>
                    <p style={{ fontSize: '10px', color: '#3498db' }}>
                      {item.style?.join('・')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* コーデ詳細モーダル */}
      {selectedCoord && (
        <div
          onClick={() => setSelectedCoord(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px 16px 0 0',
              padding: '20px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#888' }}>{selectedCoord.date}</p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={() => removeCoord(selectedCoord.id)}
                  style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', padding: 0 }}
                >
                  ❤️
                </button>
                <button
                  onClick={() => setSelectedCoord(null)}
                  style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {selectedCoord.image && (
              <img
                src={selectedCoord.image}
                alt="コーデ画像"
                style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '300px', display: 'block', marginBottom: '16px' }}
              />
            )}

            <p style={{ fontSize: '14px', marginBottom: '8px' }}>{selectedCoord.comment}</p>
            <p style={{ fontSize: '12px', color: '#3498db', marginBottom: '16px' }}>
              系統：{selectedCoord.style?.join('・')}
            </p>

            {selectedCoord.items && selectedCoord.items.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>🛍️ アイテム</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedCoord.items.map((i, j) => (
                    <span key={j} style={{
                      background: '#f0f0f0', borderRadius: '4px',
                      padding: '4px 10px', fontSize: '12px', color: '#555',
                    }}>
                      {i.category}（{i.color}）
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedCoord.buySuggestions && selectedCoord.buySuggestions.length > 0 && (
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '12px' }}>🛒 購入候補</p>
                {selectedCoord.buySuggestions.map((buy, i) => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '2px' }}>
                      {buy.category}（{buy.color}）{buy.type === 'accessory' && ' 💍'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{buy.reason}</p>
                    {buy.rakuten?.map((r, j) => (
                      <a key={j} href={r.url} target="_blank" rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                          display: 'flex', gap: '10px', background: '#f9f9f9',
                          borderRadius: '8px', padding: '10px', marginBottom: '8px', alignItems: 'center',
                        }}>
                          {r.image && (
                            <img src={r.image} alt={r.name}
                              style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: '12px', marginBottom: '4px',
                              overflow: 'hidden', display: '-webkit-box',
                              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            }}>{r.name}</p>
                            <p style={{ fontSize: '13px', color: '#e74c3c', fontWeight: 'bold' }}>
                              ¥{r.price.toLocaleString()}
                            </p>
                          </div>
                          <span style={{ fontSize: '16px', color: '#aaa', flexShrink: 0 }}>›</span>
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