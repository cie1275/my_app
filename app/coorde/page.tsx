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

type FavoriteCoord = HistoryItem & { savedAt: string }

export default function CoordePage() {
  const [activeTab, setActiveTab] = useState<'suggest' | 'history'>('suggest')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [favCoords, setFavCoords] = useState<FavoriteCoord[]>([])
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('coorde_history')
    if (saved) setHistory(JSON.parse(saved))
    const favs = localStorage.getItem('favorites_coord')
    if (favs) setFavCoords(JSON.parse(favs))
  }, [])

  const isFavorited = (id: string) => favCoords.some((f) => f.id === id)

  const toggleFavorite = (item: HistoryItem) => {
    let updated: FavoriteCoord[]
    if (isFavorited(item.id)) {
      updated = favCoords.filter((f) => f.id !== item.id)
    } else {
      updated = [{ ...item, savedAt: new Date().toISOString() }, ...favCoords]
    }
    setFavCoords(updated)
    localStorage.setItem('favorites_coord', JSON.stringify(updated))
  }

  const handleSuggestionComplete = (
    comment: string,
    style: string[],
    image?: string,
    items?: { category: string; color: string }[],
    buySuggestions?: BuySuggestion[]
  ) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('ja-JP'),
      comment,
      style,
      image,
      items,
      buySuggestions,
    }
    const newHistory = [newItem, ...history]
    setHistory(newHistory)
    localStorage.setItem('coorde_history', JSON.stringify(newHistory))
  }

  const handleAddImage = (file: File) => {
    if (!selectedItem) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      const updated = history.map((h) =>
        h.id === selectedItem.id ? { ...h, image: base64 } : h
      )
      setHistory(updated)
      localStorage.setItem('coorde_history', JSON.stringify(updated))
      setSelectedItem({ ...selectedItem, image: base64 })
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = (id: string) => {
    const updated = history.filter((h) => h.id !== id)
    setHistory(updated)
    localStorage.setItem('coorde_history', JSON.stringify(updated))
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
    <main style={{ background: '#FAFAFA', minHeight: '100vh', paddingBottom: '0px' }}>

      {/* ヘッダー */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px 12px',
        background: '#fff',
        borderBottom: '1px solid #F0F0F0',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.12em', color: '#1A2238', margin: 0 }}>
          COORDI
        </h1>
      </header>

      {/* タブ */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0F0F0' }}>
        <button style={tabStyle('suggest')} onClick={() => setActiveTab('suggest')}>
          服装提案
        </button>
        <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>
          コーデ履歴
        </button>
      </div>

      {/* 服装提案タブ：OutfitSuggestのみ */}
      {activeTab === 'suggest' && (
        <OutfitSuggest
          weather=""
          temperature=""
          clothes={[]}
          onSuggestionComplete={handleSuggestionComplete}
        />
      )}

      {/* コーデ履歴タブ */}
      {activeTab === 'history' && (
        <div style={{ padding: '16px', paddingBottom: '100px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px', color: '#CCC' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>👗</p>
              <p style={{ fontSize: '14px' }}>コーデ履歴がありません</p>
              <p style={{ fontSize: '12px', marginTop: '6px' }}>
                服装提案タブからコーデを保存しましょう
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  background: '#fff',
                  borderRadius: '14px',
                  padding: '14px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                {item.image ? (
                  <img src={item.image} alt="コーデ画像"
                    style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '10px',
                    background: '#F0EDE8', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '22px', flexShrink: 0,
                  }}>
                    👗
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '11px', color: '#BBB', marginBottom: '3px' }}>{item.date}</p>
                  <p style={{
                    fontSize: '13px', color: '#333', marginBottom: '4px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.comment}
                  </p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {item.style?.slice(0, 2).map((s, i) => (
                      <span key={i} style={{
                        background: '#F0EDE8', borderRadius: '20px',
                        padding: '2px 8px', fontSize: '10px', color: '#7A6552',
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <span
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(item) }}
                    style={{ fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}
                  >
                    {isFavorited(item.id) ? '❤️' : '🤍'}
                  </span>
                  <span
                    onClick={(e) => { e.stopPropagation(); setDeleteTargetId(item.id) }}
                    style={{ fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}
                  >
                    🗑️
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deleteTargetId && (
        <div
          onClick={() => setDeleteTargetId(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px',
              padding: '28px 24px', width: '280px', textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1A2238', marginBottom: '8px' }}>
              コーデを削除しますか？
            </p>
            <p style={{ fontSize: '13px', color: '#AAA', marginBottom: '24px' }}>
              この操作は取り消せません
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteTargetId(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1.5px solid #EEE', background: '#fff',
                  fontSize: '14px', cursor: 'pointer', color: '#555',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteTargetId)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: 'none', background: '#C0392B',
                  color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '600',
                }}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px 20px 0 0',
              padding: '24px 20px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
            }}
          >
            <div style={{
              width: '36px', height: '4px', background: '#E8E8E8',
              borderRadius: '2px', margin: '0 auto 20px',
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#AAA' }}>{selectedItem.date}</p>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <button
                  onClick={() => { toggleFavorite(selectedItem); setSelectedItem({ ...selectedItem }) }}
                  style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', padding: 0 }}
                >
                  {isFavorited(selectedItem.id) ? '❤️' : '🤍'}
                </button>
                <button
                  onClick={() => { setSelectedItem(null); setDeleteTargetId(selectedItem.id) }}
                  style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', padding: 0 }}
                >
                  🗑️
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    border: 'none', background: '#F5F5F5', borderRadius: '50%',
                    width: '28px', height: '28px', fontSize: '14px',
                    cursor: 'pointer', color: '#888', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {selectedItem.image ? (
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <img src={selectedItem.image} alt="コーデ画像"
                  style={{ width: '100%', borderRadius: '14px', objectFit: 'cover', maxHeight: '280px', display: 'block' }} />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: '10px', right: '10px',
                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                    border: 'none', borderRadius: '8px', padding: '6px 12px',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  📷 変更
                </button>
              </div>
            ) : (
              <button
                onClick={() => imageInputRef.current?.click()}
                style={{
                  width: '100%', height: '140px', borderRadius: '14px',
                  background: '#F8F6F3', border: '2px dashed #DDD',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '8px', marginBottom: '16px',
                  cursor: 'pointer', fontSize: '13px', color: '#AAA',
                }}
              >
                <span style={{ fontSize: '28px' }}>📷</span>
                コーデ画像を追加
              </button>
            )}

            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAddImage(file); e.target.value = '' }} />

            <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.7, marginBottom: '10px' }}>
              {selectedItem.comment}
            </p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {selectedItem.style?.map((s, i) => (
                <span key={i} style={{
                  background: '#1A2238', color: '#fff',
                  borderRadius: '20px', padding: '4px 12px',
                  fontSize: '11px', letterSpacing: '0.04em',
                }}>
                  {s}
                </span>
              ))}
            </div>

            {selectedItem.items && selectedItem.items.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '10px', letterSpacing: '0.05em' }}>
                  アイテム
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedItem.items.map((i, j) => (
                    <span key={j} style={{
                      background: '#F0EDE8', borderRadius: '8px',
                      padding: '6px 12px', fontSize: '12px', color: '#7A6552',
                    }}>
                      {i.category}（{i.color}）
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.buySuggestions && selectedItem.buySuggestions.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '12px', letterSpacing: '0.05em' }}>
                  購入候補
                </p>
                {selectedItem.buySuggestions.map((buy, i) => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        background: '#F0EDE8', borderRadius: '6px', padding: '3px 8px',
                        fontSize: '11px', color: '#7A6552',
                      }}>
                        {buy.category}
                      </span>
                      <span style={{ fontSize: '12px', color: '#AAA' }}>{buy.color}</span>
                      {buy.type === 'accessory' && <span>💍</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#AAA', marginBottom: '8px' }}>{buy.reason}</p>
                    {buy.rakuten?.map((r, j) => (
                      <a key={j} href={r.url} target="_blank" rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                          display: 'flex', gap: '12px', padding: '10px',
                          marginBottom: '8px', border: '1px solid #F0F0F0',
                          borderRadius: '10px', alignItems: 'center',
                        }}>
                          {r.image && (
                            <img src={r.image} alt={r.name}
                              style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: '12px', color: '#333', marginBottom: '4px',
                              overflow: 'hidden', display: '-webkit-box',
                              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            }}>
                              {r.name}
                            </p>
                            <p style={{ fontSize: '13px', color: '#C0392B', fontWeight: '700' }}>
                              ¥{r.price.toLocaleString()}
                            </p>
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