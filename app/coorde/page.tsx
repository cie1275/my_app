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
    setActiveTab('history')
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
    borderBottom: activeTab === tab ? '2px solid #3498db' : '2px solid #eee',
    background: 'none',
    color: activeTab === tab ? '#3498db' : '#888',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: activeTab === tab ? ('bold' as const) : ('normal' as const),
  })

  return (
    <main style={{ paddingBottom: '100px' }}>
      <h1 style={{ padding: '16px', fontSize: '18px', margin: 0 }}>コーデ</h1>

      <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
        <button style={tabStyle('suggest')} onClick={() => setActiveTab('suggest')}>
          👗 服装提案
        </button>
        <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>
          📋 コーデ履歴
        </button>
      </div>

      {activeTab === 'suggest' && (
        <OutfitSuggest
          weather=""
          temperature=""
          clothes={[]}
          onSuggestionComplete={handleSuggestionComplete}
        />
      )}

      {activeTab === 'history' && (
        <div style={{ padding: '16px' }}>
          {history.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', marginTop: '32px' }}>
              コーデ履歴がありません
            </p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
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
                {/* サムネイル */}
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

                {/* お気に入り・削除ボタン */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
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
            background: 'rgba(0,0,0,0.5)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px',
              padding: '24px', width: '280px', textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              コーデを削除しますか？
            </p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
              この操作は取り消せません
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setDeleteTargetId(null)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: '1px solid #ddd', background: '#f5f5f5',
                  fontSize: '14px', cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteTargetId)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: 'none', background: '#e74c3c',
                  color: '#fff', fontSize: '14px', cursor: 'pointer',
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
              background: '#fff', borderRadius: '16px 16px 0 0',
              padding: '20px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            {/* ヘッダー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#888' }}>{selectedItem.date}</p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={() => { toggleFavorite(selectedItem); setSelectedItem({ ...selectedItem }) }}
                  style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', padding: 0 }}
                >
                  {isFavorited(selectedItem.id) ? '❤️' : '🤍'}
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(null)
                    setDeleteTargetId(selectedItem.id)
                  }}
                  style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', padding: 0 }}
                >
                  🗑️
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 画像エリア */}
            {selectedItem.image ? (
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <img
                  src={selectedItem.image}
                  alt="コーデ画像"
                  style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '300px', display: 'block' }}
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: '8px', right: '8px',
                    background: 'rgba(0,0,0,0.55)', color: '#fff',
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
                  width: '100%', height: '140px', borderRadius: '12px',
                  background: '#f5f5f5', border: '2px dashed #ddd',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '8px', marginBottom: '16px',
                  cursor: 'pointer', fontSize: '13px', color: '#888',
                }}
              >
                <span style={{ fontSize: '32px' }}>📷</span>
                コーデ画像を追加
              </button>
            )}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAddImage(file)
                e.target.value = ''
              }}
            />

            <p style={{ fontSize: '14px', marginBottom: '8px' }}>{selectedItem.comment}</p>
            <p style={{ fontSize: '12px', color: '#3498db', marginBottom: '16px' }}>
              系統：{selectedItem.style?.join('・')}
            </p>

            {selectedItem.items && selectedItem.items.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>🛍️ アイテム</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedItem.items.map((i, j) => (
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

            {selectedItem.buySuggestions && selectedItem.buySuggestions.length > 0 && (
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '12px' }}>🛒 購入候補</p>
                {selectedItem.buySuggestions.map((buy, i) => (
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