// components/OutfitSuggest.tsx
'use client'

import { useState, useRef, useEffect } from 'react'

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

type ImageCredit = {
  name: string
  link: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  type: 'text' | 'suggestion'
  content?: string
  suggestion?: Suggestion
  attachedImage?: string
  generatedImage?: string
  imageCredit?: ImageCredit
  generatingImage?: boolean
  imageTimeout?: boolean
  saved?: boolean
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      type: 'text',
      content: '今日のコーデを提案します。\n予算や画像があれば設定して、提案ボタンを押してください。',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [totalBudget, setTotalBudget] = useState('')
  const [itemBudget, setItemBudget] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [useCloset, setUseCloset] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const fetchOutfitImage = async (
    msgId: string,
    suggestion: Suggestion,
    items: { category: string; color: string }[]
  ) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, generatingImage: true } : m
    ))
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: suggestion.style,
          items,
          userId: localStorage.getItem('db_user_id'),
        }),
      })
      const json = await res.json()
      console.log('generate-image response:', json.success, json.image?.slice(0, 50))
      if (json.success && json.image) {
        setMessages(prev => prev.map(m => {
          if (m.id === msgId) {
            return { ...m, generatedImage: json.image, generatingImage: false }
          }
          return m
        }))
          console.log('state updated with image')
      } else if (json.error === 'timeout') {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, generatingImage: false, imageTimeout: true } : m
        ))
      } else {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, generatingImage: false } : m
        ))
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, generatingImage: false } : m
      ))
    }
  }

  const handleSuggest = async () => {
    if (loading) return
    setLoading(true)

    const parts: string[] = []
    if (uploadedImage) parts.push('📷 画像あり')
    parts.push(useCloset ? '👚 クローゼットを使用' : '🛍️ クローゼットを使用しない')
    if (totalBudget) parts.push(`全体予算：¥${Number(totalBudget).toLocaleString()}`)
    if (itemBudget) parts.push(`アイテム予算：¥${Number(itemBudget).toLocaleString()}`)
    parts.push('👗 コーデを提案して')

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      type: 'text',
      content: parts.join('　'),
      attachedImage: uploadedImage ?? undefined,
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/outfit-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weather,
        temperature,
        clothes: useCloset ? clothes : [],
        totalBudget: totalBudget ? Number(totalBudget) : null,
        itemBudget: itemBudget ? Number(itemBudget) : null,
        userId: localStorage.getItem('db_user_id'),
      }),
    })
      const json = await res.json()
      if (json.success) {
        const msgId = (Date.now() + 1).toString()
        const assistantMsg: Message = {
          id: msgId,
          role: 'assistant',
          type: 'suggestion',
          suggestion: json.suggestion as Suggestion,
          attachedImage: uploadedImage ?? undefined,
          generatingImage: false,
          saved: false,
        }
        setMessages(prev => [...prev, assistantMsg])

        const items: { category: string; color: string }[] = (json.suggestion.buy_suggestions as BuySuggestion[]).map(item => ({
          category: item.category,
          color: item.color,
        }))
        fetchOutfitImage(msgId, json.suggestion as Suggestion, items)
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        type: 'text' as const,
        content: '提案の取得に失敗しました。もう一度お試しください。',
      }])
    } finally {
      setLoading(false)
      setUploadedImage(null)
    }
  }

  const handleSave = (msg: Message) => {
    if (!msg.suggestion || !onSuggestionComplete) return
    const items: { category: string; color: string }[] = msg.suggestion.buy_suggestions.map(item => ({
      category: item.category,
      color: item.color,
    }))
    onSuggestionComplete(
      msg.suggestion.comment,
      msg.suggestion.style,
      msg.generatedImage ?? msg.attachedImage,
      items,
      msg.suggestion.buy_suggestions
    )
    setMessages(prev => prev.map(m =>
      m.id === msg.id ? { ...m, saved: true } : m
    ))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const dotStyle = (delay: string): React.CSSProperties => ({
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#CCC',
    animation: `bounce 1.2s ease-in-out ${delay} infinite`,
  })

  const dotStyleBrown = (delay: string): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#7A6552',
    animation: `bounce 1.2s ease-in-out ${delay} infinite`,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 170px)' }}>

      {/* メッセージエリア */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '16px',
        background: '#FAFAFA',
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {/* AIアバター */}
            {msg.role === 'assistant' && (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#1A2238', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '14px', marginBottom: '6px',
              }}>
                👗
              </div>
            )}

            {/* テキストメッセージ */}
            {msg.type === 'text' && (
              <div style={{
                maxWidth: '80%',
                background: msg.role === 'user' ? '#1A2238' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#333',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                padding: '12px 16px',
                fontSize: '14px',
                lineHeight: 1.6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                whiteSpace: 'pre-line',
              }}>
                {msg.content}
              </div>
            )}

            {/* ユーザー添付画像 */}
            {msg.role === 'user' && msg.attachedImage && (
              <img
                src={msg.attachedImage}
                alt="添付画像"
                style={{ maxWidth: '160px', borderRadius: '12px', marginTop: '6px', objectFit: 'cover' }}
              />
            )}

            {/* 提案メッセージ */}
            {msg.type === 'suggestion' && msg.suggestion && (
              <div style={{
                width: '100%', background: '#fff',
                borderRadius: '4px 18px 18px 18px',
                padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              }}>

                {/* 画像エリア */}
                {msg.generatingImage ? (
                <div style={{
                  width: '100%', height: '200px', borderRadius: '12px',
                  background: '#F0EDE8', marginBottom: '14px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '10px',
                }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={dotStyleBrown('0s')} />
                    <div style={dotStyleBrown('0.2s')} />
                    <div style={dotStyleBrown('0.4s')} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#7A6552' }}>イメージ画像を取得中...</p>
                </div>
              ) : msg.imageTimeout ? (
                <div style={{
                  width: '100%', borderRadius: '12px',
                  background: '#FFF5F5', marginBottom: '14px',
                  padding: '16px', textAlign: 'center',
                  border: '1px solid #FFD0D0',
                }}>
                  <p style={{ fontSize: '13px', color: '#C0392B', marginBottom: '4px' }}>
                    ⏱ 画像の生成がタイムアウトしました
                  </p>
                  <p style={{ fontSize: '11px', color: '#AAA' }}>
                    再度提案ボタンを押してみてください
                  </p>
                </div>
              ) : msg.generatedImage ? (
                <div style={{ marginBottom: '14px' }}>
                  <img
                    src={msg.generatedImage}
                    alt="コーデイメージ"
                    onError={(e) => console.log('画像表示エラー:', e)}
                    onLoad={() => console.log('画像表示成功')}
                    style={{
                      width: '100%', borderRadius: '12px',
                      objectFit: 'contain', maxHeight: '400px', display: 'block',
                      background: '#F8F6F3',
                    }}
                  />
                </div>
              ) : null}

                {/* コメント */}
                <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.7, marginBottom: '10px' }}>
                  {msg.suggestion.comment}
                </p>

                {/* スタイルタグ */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {msg.suggestion.style.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        background: '#1A2238', color: '#fff',
                        borderRadius: '20px', padding: '3px 10px',
                        fontSize: '11px', letterSpacing: '0.04em',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* 手持ちアイテム */}
                {msg.suggestion.use_clothes.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '8px', letterSpacing: '0.05em' }}>
                      手持ちアイテム
                    </p>
                    {msg.suggestion.use_clothes.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex', gap: '10px', alignItems: 'flex-start',
                          padding: '8px 0',
                          borderBottom: i < msg.suggestion!.use_clothes.length - 1 ? '1px solid #F5F5F5' : 'none',
                        }}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: '#F0EDE8', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', flexShrink: 0,
                        }}>
                          👔
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A2238', marginBottom: '1px' }}>
                            {item.category}
                          </p>
                          <p style={{ fontSize: '11px', color: '#AAA' }}>{item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 購入候補 */}
                {msg.suggestion.buy_suggestions.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '8px', letterSpacing: '0.05em' }}>
                      購入候補
                    </p>
                    {msg.suggestion.buy_suggestions.map((item, i) => (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{
                            background: '#F0EDE8', borderRadius: '6px',
                            padding: '2px 8px', fontSize: '11px', color: '#7A6552',
                          }}>
                            {item.category}
                          </span>
                          <span style={{ fontSize: '11px', color: '#AAA' }}>{item.color}</span>
                          {item.type === 'accessory' && (
                            <span style={{ fontSize: '11px' }}>💍</span>
                          )}
                        </div>
                        <p style={{ fontSize: '11px', color: '#BBB', marginBottom: '6px' }}>{item.reason}</p>
                        {item.rakuten.map((r, j) => (
                          
                          <a  key={j}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <div style={{
                              display: 'flex', gap: '10px', padding: '8px',
                              marginBottom: '6px', border: '1px solid #F0F0F0',
                              borderRadius: '10px', alignItems: 'center',
                            }}>
                              {r.image && (
                                <img
                                  src={r.image}
                                  alt={r.name}
                                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                                />
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: '12px', color: '#333', marginBottom: '3px',
                                  overflow: 'hidden', display: '-webkit-box',
                                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                }}>
                                  {r.name}
                                </p>
                                <p style={{ fontSize: '12px', color: '#C0392B', fontWeight: '700' }}>
                                  {'¥'}{r.price.toLocaleString()}
                                </p>
                              </div>
                              <span style={{ color: '#CCC', fontSize: '16px', flexShrink: 0 }}>{'›'}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* 保存ボタン */}
                <button
                  onClick={() => handleSave(msg)}
                  disabled={msg.saved}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    border: msg.saved ? 'none' : '1.5px solid #1A2238',
                    background: msg.saved ? '#F0EDE8' : 'transparent',
                    color: msg.saved ? '#7A6552' : '#1A2238',
                    fontSize: '13px', fontWeight: '600',
                    cursor: msg.saved ? 'default' : 'pointer',
                    letterSpacing: '0.04em',
                    transition: 'all 0.2s',
                  }}
                >
                  {msg.saved ? '✓ 履歴に保存しました' : '📋 このコーデを履歴に保存'}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* 提案ローディング */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#1A2238', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '14px',
            }}>
              👗
            </div>
            <div style={{
              background: '#fff', borderRadius: '4px 18px 18px 18px',
              padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
            }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={dotStyle('0s')} />
                <div style={dotStyle('0.2s')} />
                <div style={dotStyle('0.4s')} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div style={{ background: '#fff', borderTop: '1px solid #F0F0F0', padding: '12px 16px' }}>

        {/* 画像プレビュー */}
        {uploadedImage && (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
            <img
              src={uploadedImage}
              alt="添付画像"
              style={{ height: '64px', width: '64px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #EEE' }}
            />
            <button
              onClick={() => setUploadedImage(null)}
              style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#555', color: '#fff', border: 'none',
                borderRadius: '50%', width: '20px', height: '20px',
                fontSize: '11px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* クローゼット使用トグル */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '10px', padding: '8px 12px',
          background: '#F8F6F3', borderRadius: '10px',
        }}>
          <span style={{ fontSize: '13px', color: '#555' }}>
            👚 クローゼットの服を使う
          </span>
          <button
            onClick={() => setUseCloset(!useCloset)}
            style={{
              width: '44px', height: '24px', borderRadius: '12px',
              border: 'none', cursor: 'pointer',
              background: useCloset ? '#1A2238' : '#DDD',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: '#fff', position: 'absolute',
              top: '3px', transition: 'left 0.2s',
              left: useCloset ? '23px' : '3px',
            }} />
          </button>
        </div>

        {/* 予算入力 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            placeholder="全体予算（円）"
            style={{
              flex: 1, padding: '9px 12px', borderRadius: '20px',
              border: '1.5px solid #EEE', fontSize: '13px',
              outline: 'none', color: '#333', background: '#FAFAFA',
            }}
          />
          <input
            type="number"
            value={itemBudget}
            onChange={(e) => setItemBudget(e.target.value)}
            placeholder="アイテム予算（円）"
            style={{
              flex: 1, padding: '9px 12px', borderRadius: '20px',
              border: '1.5px solid #EEE', fontSize: '13px',
              outline: 'none', color: '#333', background: '#FAFAFA',
            }}
          />
        </div>

        {/* 送信行 */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => imageInputRef.current?.click()}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '1.5px solid #EEE', background: '#FAFAFA',
              fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            📷
          </button>
          <button
            onClick={handleSuggest}
            disabled={loading}
            style={{
              flex: 1, padding: '12px', borderRadius: '20px',
              border: 'none',
              background: loading ? '#CCC' : '#1A2238',
              color: '#fff', fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'background 0.2s',
            }}
          >
            {loading ? '提案中...' : 'コーデを提案する ›'}
          </button>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}