// components/OutfitSuggest.tsx
'use client'

import { useState } from 'react'

type Cloth = {
  id: string
  category: string
  color: string
  season: string
  style: string[]
}

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

type Suggestion = {
  comment: string
  style: string[]
  use_clothes: { id: string; category: string; reason: string }[]
  buy_suggestions: BuySuggestion[]
}

type Props = {
  weather: string
  temperature: string
  clothes: Cloth[]
  onSuggestionComplete?: (
    comment: string,
    style: string[],
    image?: string,
    items?: { category: string; color: string }[],
    buySuggestions?: BuySuggestion[]
  ) => void
}

export default function OutfitSuggest({ weather, temperature, clothes, onSuggestionComplete }: Props) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [totalBudget, setTotalBudget] = useState<string>('')
  const [itemBudget, setItemBudget] = useState<string>('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const handleSuggest = async () => {
    setLoading(true)
    setSuggestion(null)
    try {
      const res = await fetch('/api/outfit-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather,
          temperature,
          clothes,
          totalBudget: totalBudget ? Number(totalBudget) : null,
          itemBudget: itemBudget ? Number(itemBudget) : null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSuggestion(json.suggestion)

        if (onSuggestionComplete) {
          const items = json.suggestion.buy_suggestions.map((item: BuySuggestion) => ({
            category: item.category,
            color: item.color,
          }))
          onSuggestionComplete(
            json.suggestion.comment,
            json.suggestion.style,
            uploadedImage ?? undefined,
            items,
            json.suggestion.buy_suggestions
          )
        }
      }
    } catch (error) {
      console.error('提案エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '360px',
      margin: '16px auto',
    }}>
      <h2 style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>
        今日の服装提案
      </h2>

      {/* コーデ画像アップロード */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '13px', color: '#555' }}>コーデ画像（任意）</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'block', marginTop: '4px', fontSize: '13px' }}
        />
        {uploadedImage && (
          <img
            src={uploadedImage}
            alt="コーデ画像"
            style={{ width: '100%', borderRadius: '8px', marginTop: '8px', maxHeight: '200px', objectFit: 'cover' }}
          />
        )}
      </div>

      {/* 予算設定 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', color: '#555' }}>全体の予算上限（円）</label>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            placeholder="例：10000"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '13px',
              marginTop: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', color: '#555' }}>アイテムごとの予算上限（円）</label>
          <input
            type="number"
            value={itemBudget}
            onChange={(e) => setItemBudget(e.target.value)}
            placeholder="例：3000"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '13px',
              marginTop: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <button
        onClick={handleSuggest}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          background: '#3498db',
          color: '#fff',
          fontSize: '15px',
          cursor: 'pointer',
        }}
      >
        {loading ? '提案中...' : '👗 服装を提案する'}
      </button>

      {suggestion && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>
            {suggestion.comment}
          </p>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
            系統：{suggestion.style?.join('・')}
          </p>

          {/* 持っている服から使うアイテム */}
          {suggestion.use_clothes?.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
                👔 持っている服から使う
              </p>
              {suggestion.use_clothes.map((item, i) => (
                <div key={i} style={{
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '8px',
                  fontSize: '13px',
                }}>
                  <p>{item.category}</p>
                  <p style={{ color: '#888' }}>{item.reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* 購入候補 */}
          {suggestion.buy_suggestions?.length > 0 && (
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
                🛍️ 購入候補
              </p>
              {suggestion.buy_suggestions.map((item, i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 'bold' }}>
                    {item.category}（{item.color}）
                    {item.type === 'accessory' && ' 💍'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                    {item.reason}
                  </p>
                  {item.rakuten?.map((r, j) => (
                    
                    <a  key={j}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        background: '#f9f9f9',
                        borderRadius: '8px',
                        padding: '8px',
                        marginBottom: '8px',
                      }}>
                        {r.image && (
                          <img
                            src={r.image}
                            alt={r.name}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        )}
                        <div style={{ fontSize: '12px' }}>
                          <p style={{ marginBottom: '4px' }}>{r.name.slice(0, 30)}...</p>
                          <p style={{ color: '#e74c3c' }}>¥{r.price.toLocaleString()}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}