// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '../../lib/cognito'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (json.userId) {
        localStorage.setItem('db_user_id', String(json.userId))
      }

      router.push('/')
    } catch (err: any) {
      setError(err.message ?? 'ログインに失敗しました')
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
          ログイン
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
            placeholder="パスワード"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '12px',
              border: '1.5px solid #EEE', fontSize: '14px',
              outline: 'none', color: '#333', background: '#fff',
              boxSizing: 'border-box',
            }}
          />
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
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>

        <p style={{ fontSize: '13px', color: '#AAA', textAlign: 'center' }}>
          アカウントをお持ちでない方は{' '}
          <span
            onClick={() => router.push('/signup')}
            style={{ color: '#1A2238', fontWeight: '600', cursor: 'pointer' }}
          >
            新規登録
          </span>
        </p>
      </div>
    </main>
  )
}