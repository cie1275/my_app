// app/confirm/page.tsx
'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { confirmSignUp } from '../../lib/cognito'

function ConfirmForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await confirmSignUp(email, code)
      router.push('/login')
    } catch (err: any) {
      setError(err.message ?? '確認に失敗しました')
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
        <p style={{ fontSize: '13px', color: '#AAA', textAlign: 'center', marginBottom: '8px' }}>
          確認コードを入力
        </p>
        <p style={{ fontSize: '12px', color: '#BBB', textAlign: 'center', marginBottom: '32px' }}>
          {email} に送信されたコードを入力してください
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="確認コード（6桁）"
          style={{
            width: '100%', padding: '14px 16px', borderRadius: '12px',
            border: '1.5px solid #EEE', fontSize: '14px',
            outline: 'none', color: '#333', background: '#fff',
            boxSizing: 'border-box', marginBottom: '12px',
            textAlign: 'center', letterSpacing: '0.2em',
          }}
        />

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
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '確認中...' : '確認する'}
        </button>
      </div>
    </main>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmForm />
    </Suspense>
  )
}