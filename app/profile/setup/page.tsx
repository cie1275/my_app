// app/profile/setup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STYLES = [
  { label: 'コンサバ', group: 'きれいめ系' },
  { label: 'トラッド', group: 'きれいめ系' },
  { label: 'フェミニン', group: 'きれいめ系' },
  { label: 'コンサバカジュアル', group: 'きれいめ系' },
  { label: 'ベーシック', group: 'カジュアル系' },
  { label: 'ストリートカジュアル', group: 'カジュアル系' },
  { label: 'スポーツカジュアル', group: 'カジュアル系' },
  { label: 'アメカジ', group: 'カジュアル系' },
  { label: 'モードカジュアル', group: 'カジュアル系' },
  { label: 'ノームコア', group: 'カジュアル系' },
  { label: 'アウトドア', group: 'その他' },
  { label: 'ナチュラル', group: 'その他' },
  { label: 'モード', group: 'その他' },
  { label: 'ゴシック', group: 'その他' },
  { label: '韓国系', group: 'その他' },
]

const HAIR_STYLES = [
  'ショート', 'ボブ', 'ミディアム', 'ロング', 'パーマ', 'ストレート', 'ウェーブ', 'アップスタイル'
]

const groups = [...new Set(STYLES.map((s) => s.group))]

export default function ProfileSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [gender, setGender] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [hairStyle, setHairStyle] = useState('')
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    )
  }

  const handleSubmit = async () => {
    if (selectedStyles.length === 0) {
      setError('好みの系統を1つ以上選択してください')
      return
    }
    setLoading(true)
    setError('')
    try {
      const userId = localStorage.getItem('db_user_id')
      const res = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gender,
          height: height ? Number(height) : null,
          weight: weight ? Number(weight) : null,
          hairStyle,
          preferredStyles: selectedStyles,
        }),
      })
      const json = await res.json()
      if (json.success) {
        localStorage.setItem('profile_completed', 'true')
        router.push('/')
      } else {
        setError(json.error ?? '保存に失敗しました')
      }
    } catch {
      setError('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #EEE',
    fontSize: '14px',
    outline: 'none',
    color: '#333',
    background: '#fff',
    boxSizing: 'border-box' as const,
  }

  return (
    <main style={{
      minHeight: '100vh', background: '#FAFAFA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* ヘッダー */}
        <h1 style={{
          fontSize: '24px', fontWeight: '700', letterSpacing: '0.08em',
          color: '#1A2238', textAlign: 'center', marginBottom: '4px',
          fontStyle: 'italic',
        }}>
          L'Atelier
        </h1>
        <p style={{ fontSize: '13px', color: '#AAA', textAlign: 'center', marginBottom: '8px' }}>
          プロフィール設定
        </p>

        {/* ステップインジケーター */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', justifyContent: 'center' }}>
          {[1, 2].map((s) => (
            <div key={s} style={{
              width: '32px', height: '4px', borderRadius: '2px',
              background: step >= s ? '#1A2238' : '#EEE',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* ステップ1：基本情報 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#1A2238', marginBottom: '4px' }}>
              基本情報を教えてください
            </p>

            {/* 性別 */}
            <div>
              <label style={{ fontSize: '12px', color: '#AAA', display: 'block', marginBottom: '8px' }}>
                性別
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['メンズ', 'レディース', 'その他'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      border: gender === g ? 'none' : '1.5px solid #EEE',
                      background: gender === g ? '#1A2238' : '#fff',
                      color: gender === g ? '#fff' : '#555',
                      fontSize: '13px', cursor: 'pointer', fontWeight: '500',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* 身長 */}
            <div>
              <label style={{ fontSize: '12px', color: '#AAA', display: 'block', marginBottom: '8px' }}>
                身長（cm）
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="例：165"
                style={inputStyle}
              />
            </div>

            {/* 体重 */}
            <div>
              <label style={{ fontSize: '12px', color: '#AAA', display: 'block', marginBottom: '8px' }}>
                体重（kg）
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例：55"
                style={inputStyle}
              />
            </div>

            {/* 髪型 */}
            <div>
              <label style={{ fontSize: '12px', color: '#AAA', display: 'block', marginBottom: '8px' }}>
                髪型
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {HAIR_STYLES.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHairStyle(h)}
                    style={{
                      padding: '8px 14px', borderRadius: '20px',
                      border: hairStyle === h ? 'none' : '1.5px solid #EEE',
                      background: hairStyle === h ? '#1A2238' : '#fff',
                      color: hairStyle === h ? '#fff' : '#555',
                      fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!gender}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                border: 'none', background: !gender ? '#CCC' : '#1A2238',
                color: '#fff', fontSize: '15px', fontWeight: '600',
                cursor: !gender ? 'not-allowed' : 'pointer', marginTop: '8px',
              }}
            >
              次へ →
            </button>
          </div>
        )}

        {/* ステップ2：好みの系統 */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#1A2238', marginBottom: '4px' }}>
              好みのスタイルを選んでください
            </p>
            <p style={{ fontSize: '12px', color: '#AAA', marginBottom: '16px' }}>
              複数選択可
            </p>

            {groups.map((group) => (
              <div key={group} style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', color: '#AAA', letterSpacing: '0.06em', marginBottom: '8px', fontWeight: '600' }}>
                  {group.toUpperCase()}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {STYLES.filter((s) => s.group === group).map((s) => (
                    <button
                      key={s.label}
                      onClick={() => toggleStyle(s.label)}
                      style={{
                        padding: '8px 14px', borderRadius: '20px',
                        border: selectedStyles.includes(s.label) ? 'none' : '1.5px solid #EEE',
                        background: selectedStyles.includes(s.label) ? '#1A2238' : '#fff',
                        color: selectedStyles.includes(s.label) ? '#fff' : '#555',
                        fontSize: '13px', cursor: 'pointer',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {error && (
              <p style={{ fontSize: '13px', color: '#C0392B', marginBottom: '12px', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1, padding: '14px', borderRadius: '12px',
                  border: '1.5px solid #EEE', background: '#fff',
                  color: '#555', fontSize: '15px', cursor: 'pointer',
                }}
              >
                ← 戻る
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  flex: 2, padding: '14px', borderRadius: '12px',
                  border: 'none', background: loading ? '#CCC' : '#1A2238',
                  color: '#fff', fontSize: '15px', fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '保存中...' : '完了'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}