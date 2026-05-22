// components/ImageUpload.tsx
'use client'

import { useState, useRef } from 'react'

type AnalysisResult = {
  category?: string
  color?: string
  season?: string
  style?: string[]
  confidence?: string
  items?: {
    category: string
    color: string
    season: string
    style: string[]
    confidence: string
  }[]
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

type Props = {
  onUploadComplete: (url: string, key: string, analysis: AnalysisResult) => void
  label?: string
  mode?: 'single' | 'coordinate'
}

export default function ImageUpload({
  onUploadComplete,
  label = '画像をアップロード',
  mode = 'single'
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [favItems, setFavItems] = useState<FavoriteItem[]>(() => {
    if (typeof window === 'undefined') return []
    const saved = localStorage.getItem('favorites_item')
    return saved ? JSON.parse(saved) : []
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!file) return
    setUploading(true)
    setAnalysis(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      setPreview(base64)

      try {
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await fetch('/api/images', {
          method: 'POST',
          body: formData,
        })
        const uploadJson = await uploadRes.json()

        const analyzeRes = await fetch('/api/analyze-clothes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64.split(',')[1],
            imageType: file.type,
            mode,
          }),
        })
        const analyzeJson = await analyzeRes.json()

        if (analyzeJson.success) {
          setAnalysis(analyzeJson.result)
          onUploadComplete(uploadJson.url, uploadJson.key, analyzeJson.result)
        }
      } catch (error) {
        console.error('エラー:', error)
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const toggleFavoriteItem = (result: AnalysisResult) => {
    const existing = favItems.find(
      (f) => f.category === result.category && f.color === result.color
    )
    let updated: FavoriteItem[]
    if (existing) {
      updated = favItems.filter((f) => f.id !== existing.id)
    } else {
      const newFav: FavoriteItem = {
        id: Date.now().toString(),
        savedAt: new Date().toISOString(),
        image: preview ?? '',
        category: result.category,
        color: result.color,
        season: result.season,
        style: result.style,
      }
      updated = [newFav, ...favItems]
    }
    setFavItems(updated)
    localStorage.setItem('favorites_item', JSON.stringify(updated))
  }

  const isItemFavorited = (result: AnalysisResult) =>
    favItems.some((f) => f.category === result.category && f.color === result.color)

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '360px',
      margin: '16px auto',
    }}>
      <h2 style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>{label}</h2>

      {preview && (
        <img
          src={preview}
          alt="プレビュー"
          style={{ width: '100%', borderRadius: '8px', marginBottom: '12px' }}
        />
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            border: '1px solid #ddd', background: '#f5f5f5',
            cursor: 'pointer', fontSize: '13px',
          }}
        >
          📁 ギャラリー
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            border: '1px solid #ddd', background: '#f5f5f5',
            cursor: 'pointer', fontSize: '13px',
          }}
        >
          📷 カメラ
        </button>
      </div>

      {uploading && (
        <p style={{ textAlign: 'center', color: '#888', fontSize: '13px' }}>解析中...</p>
      )}

      {analysis && (
        <div style={{ marginTop: '12px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontWeight: 'bold' }}>解析結果：</p>
            {/* 服単体のみお気に入りボタン表示 */}
            {mode === 'single' && (
              <button
                onClick={() => toggleFavoriteItem(analysis)}
                style={{
                  border: 'none', background: 'none',
                  fontSize: '22px', cursor: 'pointer', padding: 0,
                }}
              >
                {isItemFavorited(analysis) ? '❤️' : '🤍'}
              </button>
            )}
          </div>

          {mode === 'single' ? (
            <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '10px' }}>
              <p>カテゴリ：{analysis.category}</p>
              <p>色：{analysis.color}</p>
              <p>季節：{analysis.season}</p>
              <p>系統：{analysis.style?.join('・')}</p>
              <p>確信度：{analysis.confidence}</p>
            </div>
          ) : (
            <div>
              <p>全体の系統：{analysis.style?.join('・')}</p>
              {analysis.items?.map((item, i) => (
                <div key={i} style={{ background: '#f9f9f9', borderRadius: '8px', padding: '10px', marginTop: '8px' }}>
                  <p>カテゴリ：{item.category}</p>
                  <p>色：{item.color}</p>
                  <p>季節：{item.season}</p>
                  <p>系統：{item.style?.join('・')}</p>
                  <p>確信度：{item.confidence}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
    </div>
  )
}