// app/closet/page.tsx
'use client'

import { useState, useEffect } from 'react'
import BottomNav from '../../components/BottomNav'
import ImageUpload from '../../components/ImageUpload'

type ClothItem = {
  id: string
  image: string
  category: string
  color: string
  season: string
  style: string[]
  registeredAt: string
  isFavorite?: boolean
}

export default function ClosetPage() {
  const [clothes, setClothes] = useState<ClothItem[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ClothItem | null>(null)
  const [favItems, setFavItems] = useState<ClothItem[]>(() => {
    if (typeof window === 'undefined') return []
    const saved = localStorage.getItem('favorites_item')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    const saved = localStorage.getItem('closet_clothes')
    if (saved) setClothes(JSON.parse(saved))
    const favs = localStorage.getItem('favorites_item')
    if (favs) setFavItems(JSON.parse(favs))
  }, [])

  const handleUploadComplete = (url: string, key: string, analysis: any, base64?: string) => {
    if (!analysis) return

    const newItem: ClothItem = {
      id: Date.now().toString(),
      image: base64 ?? url,
      category: analysis.category ?? '不明',
      color: analysis.color ?? '不明',
      season: analysis.season ?? '不明',
      style: analysis.style ?? [],
      registeredAt: new Date().toISOString(),
    }
    const updated = [newItem, ...clothes]
    setClothes(updated)
    localStorage.setItem('closet_clothes', JSON.stringify(updated))
    setShowUpload(false)
  }

  const toggleFavorite = (item: ClothItem) => {
    const isFav = favItems.some((f) => f.id === item.id)
    let updatedFavs: ClothItem[]
    if (isFav) {
      updatedFavs = favItems.filter((f) => f.id !== item.id)
    } else {
      updatedFavs = [item, ...favItems]
    }
    setFavItems(updatedFavs)
    localStorage.setItem('favorites_item', JSON.stringify(updatedFavs))

    const updatedClothes = clothes.map((c) =>
      c.id === item.id ? { ...c, isFavorite: !isFav } : c
    )
    setClothes(updatedClothes)
    localStorage.setItem('closet_clothes', JSON.stringify(updatedClothes))

    if (selectedItem?.id === item.id) {
      setSelectedItem({ ...selectedItem, isFavorite: !isFav })
    }
  }

  const handleDelete = (id: string) => {
    const updated = clothes.filter((c) => c.id !== id)
    setClothes(updated)
    localStorage.setItem('closet_clothes', JSON.stringify(updated))

    // お気に入りからも削除
    const updatedFavs = favItems.filter((f) => f.id !== id)
    setFavItems(updatedFavs)
    localStorage.setItem('favorites_item', JSON.stringify(updatedFavs))

    setDeleteTargetId(null)
    if (selectedItem?.id === id) setSelectedItem(null)
  }

  const categoryGroups = clothes.reduce<Record<string, ClothItem[]>>((acc, item) => {
    const cat = item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* ヘッダー */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 12px', background: '#fff', borderBottom: '1px solid #F0F0F0',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.12em', color: '#1A2238', margin: 0 }}>
          CLOSET
        </h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          style={{
            background: '#1A2238', color: '#fff', border: 'none',
            borderRadius: '20px', padding: '8px 16px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          ＋ 追加
        </button>
      </header>

      {/* アップロードエリア */}
      {showUpload && (
        <div style={{ padding: '0 0 8px' }}>
          <ImageUpload
            label="服の画像をアップロード"
            mode="single"
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {/* 服一覧 */}
      <div style={{ padding: '16px' }}>
        {clothes.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px', color: '#CCC' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>👕</p>
            <p style={{ fontSize: '14px' }}>クローゼットに服がありません</p>
            <p style={{ fontSize: '12px', marginTop: '6px' }}>右上の「＋ 追加」から登録しましょう</p>
          </div>
        ) : (
          Object.entries(categoryGroups).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <p style={{
                fontSize: '11px', color: '#AAA', letterSpacing: '0.08em',
                marginBottom: '10px', fontWeight: '600',
              }}>
                {category.toUpperCase()} ({items.length})
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{
                      borderRadius: '10px', overflow: 'hidden',
                      background: '#F8F6F3', cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      aspectRatio: '3/4',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.category}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    {/* お気に入りボタン */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(item) }}
                      style={{
                        position: 'absolute', top: '6px', right: '6px',
                        background: 'rgba(255,255,255,0.85)', border: 'none',
                        borderRadius: '50%', width: '28px', height: '28px',
                        fontSize: '14px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {favItems.some((f) => f.id === item.id) ? '❤️' : '🤍'}
                    </button>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
                      padding: '12px 6px 6px',
                    }}>
                      <p style={{ fontSize: '10px', color: '#fff', fontWeight: '600' }}>{item.color}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

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
              <p style={{ fontSize: '12px', color: '#AAA' }}>
                {new Date(selectedItem.registeredAt).toLocaleDateString('ja-JP')}
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={() => toggleFavorite(selectedItem)}
                  style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', padding: 0 }}
                >
                  {favItems.some((f) => f.id === selectedItem.id) ? '❤️' : '🤍'}
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
                    cursor: 'pointer', color: '#888',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <img
              src={selectedItem.image}
              alt={selectedItem.category}
              style={{
                width: '100%', borderRadius: '14px', objectFit: 'contain',
                maxHeight: '360px', display: 'block', background: '#F8F6F3',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'カテゴリ', value: selectedItem.category },
                { label: '色', value: selectedItem.color },
                { label: '季節', value: selectedItem.season },
              ].map((row) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '10px 0',
                  borderBottom: '1px solid #F5F5F5',
                }}>
                  <span style={{ fontSize: '12px', color: '#AAA' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                <span style={{ fontSize: '12px', color: '#AAA' }}>系統</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {selectedItem.style.map((s, i) => (
                    <span key={i} style={{
                      background: '#1A2238', color: '#fff',
                      borderRadius: '20px', padding: '3px 10px',
                      fontSize: '11px',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
              この服を削除しますか？
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

      <BottomNav />
    </main>
  )
}