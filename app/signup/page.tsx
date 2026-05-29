// app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '../../lib/cognito'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password)
      router.push(`/confirm?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      setError(err.message ?? '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh', background: '#FAFAFA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <h1 style={{
          fontSize: '28px', fontWeight: '700', letterSpacing: '0.08em',
          color: '#1A2238', textAlign: 'center', marginBottom: '8px',
          fontStyle: 'italic',
        }}>
          L'Atelier
        </h1>
        <p style={{ fontSize: '13px', color: '#AAA', textAlign: 'center', marginBottom: '32px' }}>
          新規登録
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '12px',
              border: '1.5px solid #EEE', fontSize: '14px',
              outline: 'none', color: '#333', background: '#fff',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード（8文字以上）"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '12px',
              border: '1.5px solid #EEE', fontSize: '14px',
              outline: 'none', color: '#333', background: '#fff',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="パスワード（確認）"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '12px',
              border: '1.5px solid #EEE', fontSize: '14px',
              outline: 'none', color: '#333', background: '#fff',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: '11px', color: '#AAA', marginTop: '-4px', paddingLeft: '4px' }}>
            ※英大文字・小文字・数字・記号を含む8文字以上
          </p>
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#C0392B', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            border: 'none', background: loading ? '#CCC' : '#1A2238',
            color: '#fff', fontSize: '15px', fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px',
          }}
        >
          {loading ? '登録中...' : '新規登録'}
        </button>

        <p style={{ fontSize: '13px', color: '#AAA', textAlign: 'center' }}>
          すでにアカウントをお持ちの方は{' '}
          <span
            onClick={() => router.push('/login')}
            style={{ color: '#1A2238', fontWeight: '600', cursor: 'pointer' }}
          >
            ログイン
          </span>
        </p>
      </div>
    </main>
  )
}