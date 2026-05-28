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
  onUploadComplete: (url: string, key: string, analysis: AnalysisResult, base64?: string) => void
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
        const uploadRes = await fetch('/api/images', { method: 'POST', body: formData })
        const uploadJson = await uploadRes.json()

        const analyzeRes = await fetch('/api/analyze-clothes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64.split(',')[1], imageType: file.type, mode }),
        })
        const analyzeJson = await analyzeRes.json()

        if (analyzeJson.success) {
          setAnalysis(analyzeJson.result)
          onUploadComplete(uploadJson.url, uploadJson.key, analyzeJson.result, base64)
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
      margin: '12px 16px',
      background: '#fff',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '14px', letterSpacing: '0.05em' }}>
        {label.toUpperCase()}
      </p>

      {preview && (
        <img
          src={preview}
          alt="プレビュー"
          style={{ width: '100%', borderRadius: '12px', marginBottom: '14px', maxHeight: '220px', objectFit: 'cover' }}
        />
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            border: '1.5px solid #E8E4DE', background: '#FAFAF8',
            cursor: 'pointer', fontSize: '13px', color: '#555',
            fontWeight: '500',
          }}
        >
          📁 ギャラリー
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            border: '1.5px solid #E8E4DE', background: '#FAFAF8',
            cursor: 'pointer', fontSize: '13px', color: '#555',
            fontWeight: '500',
          }}
        >
          📷 カメラ
        </button>
      </div>

      {uploading && (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#AAA', fontSize: '13px' }}>
          解析中...
        </div>
      )}

      {analysis && (
        <div style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#1A2238' }}>解析結果</p>
            {mode === 'single' && (
              <button
                onClick={() => toggleFavoriteItem(analysis)}
                style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', padding: 0 }}
              >
                {isItemFavorited(analysis) ? '❤️' : '🤍'}
              </button>
            )}
          </div>

          {mode === 'single' ? (
            <div style={{ background: '#FAFAF8', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#AAA' }}>カテゴリ</span><span>{analysis.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#AAA' }}>色</span><span>{analysis.color}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#AAA' }}>季節</span><span>{analysis.season}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#AAA' }}>系統</span><span>{analysis.style?.join(' / ')}</span>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '12px', color: '#AAA', marginBottom: '8px' }}>
                全体の系統：{analysis.style?.join(' / ')}
              </p>
              {analysis.items?.map((item, i) => (
                <div key={i} style={{ background: '#FAFAF8', borderRadius: '10px', padding: '12px', marginBottom: '8px', fontSize: '13px', color: '#444' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#AAA' }}>カテゴリ</span><span>{item.category}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#AAA' }}>色</span><span>{item.color}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#AAA' }}>季節</span><span>{item.season}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
    </div>
  )
}