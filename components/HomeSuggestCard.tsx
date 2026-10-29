// components/HomeSuggestCard.tsx
'use client'

import { useEffect, useState } from 'react'

type YahooItem = {
  name: string
  price: number
  url: string
  image?: string
}

type BuySuggestion = {
  category: string
  color: string
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

type Credit = { name: string; link: string }

type Result = {
  suggestion: Suggestion
  image: string | null
  credit: Credit | null
}

type Props = {
  weather: string
  temperature: string
}

const CACHE_PREFIX = 'home_suggest_'

export default function HomeSuggestCard({ weather, temperature }: Props) {
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async (force: boolean, cancelled: () => boolean = () => false) => {
    const userId = localStorage.getItem('db_user_id')
    if (!userId) {
      return
    }

    // 同じ日・同じ天気なら保存済みの提案を再利用（Bedrockの呼び出し回数を抑える）
    const today = new Date().toLocaleDateString('sv-SE')
    const key = `${CACHE_PREFIX}${userId}_${today}_${weather}_${temperature}`

    if (!force) {
      try {
        const saved = localStorage.getItem(key)
        if (saved) {
          setResult(JSON.parse(saved))
          setLoading(false)
          setImageLoading(false)
          return
        }
      } catch {}
    }

    setLoading(true)
    setError('')

    try {
      // クローゼット（画像データは送らず、必要な項目だけ渡す）
      const closetRes = await fetch(`/api/clothes?userId=${userId}`)
      const closetJson = await closetRes.json()
      if (cancelled()) return

      const clothes = closetJson.success
        ? closetJson.clothes.map((c: any) => ({
            id: String(c.id),
            category: c.category,
            color: c.color,
            season: c.season,
            style: c.style ?? [],
          }))
        : []

      // 服装提案
      const res = await fetch('/api/outfit-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather,
          temperature,
          clothes,
          totalBudget: null,
          itemBudget: null,
          userId,
        }),
      })
      const json = await res.json()
      if (cancelled()) return
      if (!json.success || !json.suggestion?.comment) throw new Error('suggest failed')

      const suggestion: Suggestion = {
        ...json.suggestion,
        style: json.suggestion.style ?? [],
        use_clothes: json.suggestion.use_clothes ?? [],
        buy_suggestions: json.suggestion.buy_suggestions ?? [],
      }

      // テキストを先に表示し、画像はあとから差し込む
      setResult({ suggestion, image: null, credit: null })
      setLoading(false)
      setImageLoading(true)

      let image: string | null = null
      let credit: Credit | null = null
      try {
        const items = suggestion.buy_suggestions.map((b) => ({
          category: b.category,
          color: b.color,
        }))
        const imgRes = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ style: suggestion.style, items, userId }),
        })
        const imgJson = await imgRes.json()
        if (imgJson.success) {
          image = imgJson.image
          credit = imgJson.credit ?? null
        }
      } catch {}
      if (cancelled()) return

      const final: Result = { suggestion, image, credit }
      setResult(final)

      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== key)
          .forEach((k) => localStorage.removeItem(k))
        localStorage.setItem(key, JSON.stringify(final))
      } catch {}
    } catch {
      if (!cancelled()) setError('提案の取得に失敗しました')
    } finally {
      if (!cancelled()) {
        setLoading(false)
        setImageLoading(false)
      }
    }
  }

  // 天気・気温が取得できたら自動で提案
  useEffect(() => {
    if (!weather || !temperature) return
    let cancelled = false
    const timer = setTimeout(() => generate(false, () => cancelled), 1500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [weather, temperature])

  const showSkeleton = loading && !result
  const picks = (result?.suggestion.buy_suggestions ?? [])
    .map((b) => ({ b, item: b.rakuten?.[0] }))
    .filter((x) => x.item)

  return (
    <div style={{
      margin: '12px 16px',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 12px',
      }}>
        <p style={{ fontSize: '11px', color: '#AAA', letterSpacing: '0.05em' }}>
          TODAY'S COORDE
        </p>
        <button
          onClick={() => generate(true)}
          disabled={loading || imageLoading}
          style={{
            border: '1.5px solid #E8E4DE', background: '#FAFAF8',
            borderRadius: '20px', padding: '4px 12px',
            fontSize: '11px', color: '#555',
            cursor: loading || imageLoading ? 'not-allowed' : 'pointer',
            opacity: loading || imageLoading ? 0.5 : 1,
          }}
        >
          ↻ 別の提案
        </button>
      </div>

      {/* ローディング */}
      {showSkeleton && (
        <div style={{ padding: '0 20px 20px' }}>
          <div className="home-suggest-pulse" style={{ height: '240px', borderRadius: '12px', background: '#F0EDE8', marginBottom: '14px' }} />
          <div className="home-suggest-pulse" style={{ height: '12px', borderRadius: '6px', background: '#F0EDE8', marginBottom: '8px' }} />
          <div className="home-suggest-pulse" style={{ height: '12px', width: '70%', borderRadius: '6px', background: '#F0EDE8' }} />
          <p style={{ fontSize: '11px', color: '#AAA', textAlign: 'center', marginTop: '14px' }}>
            {weather ? 'コーデを考えています...' : '天気を取得しています...'}
          </p>
        </div>
      )}

      {/* エラー */}
      {!result && error && (
        <div style={{ padding: '4px 20px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#C0392B', marginBottom: '10px' }}>{error}</p>
          <button
            onClick={() => generate(true)}
            style={{
              border: 'none', background: '#1A2238', color: '#fff',
              borderRadius: '20px', padding: '8px 20px', fontSize: '12px', cursor: 'pointer',
            }}
          >
            もう一度試す
          </button>
        </div>
      )}

      {/* 提案カード */}
      {result && (
        <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {/* 画像 */}
          {result.image ? (
            <div>
              <img
                src={result.image}
                alt="今日のコーデイメージ"
                style={{
                  width: '100%', maxHeight: '380px', objectFit: 'contain',
                  background: '#F8F6F3', display: 'block',
                }}
              />
              {result.credit?.name && (
                <p style={{ fontSize: '9px', color: '#BBB', textAlign: 'right', padding: '4px 12px 0' }}>
                  {'Photo by '}
                  <a
                    href={`${result.credit.link}?utm_source=coordi_app&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#BBB', textDecoration: 'underline' }}
                  >
                    {result.credit.name}
                  </a>
                  {' on '}
                  <a
                    href="https://unsplash.com/?utm_source=coordi_app&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#BBB', textDecoration: 'underline' }}
                  >
                    Unsplash
                  </a>
                </p>
              )}
            </div>
          ) : imageLoading ? (
            <div
              className="home-suggest-pulse"
              style={{
                height: '200px', background: '#F0EDE8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <p style={{ fontSize: '12px', color: '#7A6552' }}>イメージ画像を取得中...</p>
            </div>
          ) : null}

          <div style={{ padding: '16px 20px 20px' }}>
            {/* コメント */}
            <p style={{ fontSize: '13px', color: '#3C3327', lineHeight: 1.7, marginBottom: '10px' }}>
              {result.suggestion.comment}
            </p>

            {/* スタイルタグ */}
            {result.suggestion.style.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                {result.suggestion.style.map((s, i) => (
                  <span key={i} style={{
                    background: '#1A2238', color: '#fff',
                    borderRadius: '20px', padding: '3px 10px',
                    fontSize: '11px', letterSpacing: '0.04em',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* 手持ちアイテム */}
            {result.suggestion.use_clothes.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  手持ちアイテム
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {result.suggestion.use_clothes.map((c, i) => (
                    <span key={i} style={{
                      background: '#F0EDE8', borderRadius: '8px',
                      padding: '5px 10px', fontSize: '12px', color: '#7A6552',
                    }}>
                      {c.category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 購入候補 */}
            {picks.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  購入候補
                </p>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {picks.map(({ b, item }, i) => (
                    <a
                      key={i}
                      href={item!.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flexShrink: 0, width: '120px', textDecoration: 'none', color: 'inherit',
                        border: '1px solid #F0F0F0', borderRadius: '10px', padding: '8px',
                      }}
                    >
                      {item!.image && (
                        <img
                          src={item!.image}
                          alt={item!.name}
                          style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }}
                        />
                      )}
                      <p style={{ fontSize: '10px', color: '#AAA', marginBottom: '2px' }}>{b.category}</p>
                      <p style={{
                        fontSize: '11px', color: '#333', marginBottom: '4px',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {item!.name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#C0392B', fontWeight: 700 }}>
                        {'¥'}{item!.price.toLocaleString()}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes homeSuggestPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        .home-suggest-pulse { animation: homeSuggestPulse 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}