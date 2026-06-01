// app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '../../components/BottomNav'
import { signOut } from '../../lib/cognito'

type UserProfile = {
  email: string
  gender?: string
  height?: number
  weight?: number
  hair_style?: string
  preferred_styles?: string[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem('db_user_id')
      if (!userId) return
      try {
        const res = await fetch(`/api/profile?userId=${userId}`)
        const json = await res.json()
        if (json.success) setProfile(json.profile)
      } catch {
        console.error('プロフィール取得エラー')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSignOut = () => {
    signOut()
    localStorage.removeItem('db_user_id')
    localStorage.removeItem('profile_completed')
    localStorage.removeItem('cognito_id_token')
    localStorage.removeItem('cognito_username')
    router.push('/login')
  }

  return (
    <main style={{ background: '#FAFAFA', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 12px', background: '#fff', borderBottom: '1px solid #F0F0F0',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.12em', color: '#1A2238', margin: 0, fontStyle: 'italic' }}>
          L'Atelier
        </h1>
      </header>

      <div style={{ padding: '24px 16px' }}>
        {loading ? (
          <p style={{ color: '#AAA', textAlign: 'center' }}>読み込み中...</p>
        ) : profile ? (
          <div>
            {/* プロフィールカード */}
            <div style={{
              background: '#fff', borderRadius: '16px',
              padding: '20px', marginBottom: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#F0EDE8', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '28px', margin: '0 auto 12px',
              }}>
                👤
              </div>
              <p style={{ fontSize: '14px', color: '#333', textAlign: 'center', marginBottom: '4px', fontWeight: '600' }}>
                {profile.email}
              </p>
              <p style={{ fontSize: '12px', color: '#AAA', textAlign: 'center' }}>
                {profile.gender ?? '未設定'}
              </p>
            </div>

            {/* 詳細情報 */}
            <div style={{
              background: '#fff', borderRadius: '16px',
              padding: '20px', marginBottom: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '12px', letterSpacing: '0.06em' }}>
                基本情報
              </p>
              {[
                { label: '身長', value: profile.height ? `${profile.height}cm` : '未設定' },
                { label: '体重', value: profile.weight ? `${profile.weight}kg` : '未設定' },
                { label: '髪型', value: profile.hair_style ?? '未設定' },
              ].map((row) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid #F5F5F5',
                }}>
                  <span style={{ fontSize: '13px', color: '#AAA' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* 好みの系統 */}
            <div style={{
              background: '#fff', borderRadius: '16px',
              padding: '20px', marginBottom: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '12px', letterSpacing: '0.06em' }}>
                好みのスタイル
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.preferred_styles && profile.preferred_styles.length > 0 ? (
                  profile.preferred_styles.map((s, i) => (
                    <span key={i} style={{
                      background: '#1A2238', color: '#fff',
                      borderRadius: '20px', padding: '4px 12px',
                      fontSize: '12px',
                    }}>
                      {s}
                    </span>
                  ))
                ) : (
                  <p style={{ fontSize: '13px', color: '#AAA' }}>未設定</p>
                )}
              </div>
            </div>

            {/* プロフィール編集ボタン */}
            <button
              onClick={() => router.push('/profile/setup')}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                border: '1.5px solid #1A2238', background: 'transparent',
                color: '#1A2238', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', marginBottom: '12px',
              }}
            >
              プロフィールを編集
            </button>

            {/* ログアウトボタン */}
            <button
              onClick={handleSignOut}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                border: 'none', background: '#C0392B',
                color: '#fff', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              ログアウト
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <p style={{ color: '#AAA' }}>プロフィールが取得できませんでした</p>
            <button
              onClick={handleSignOut}
              style={{
                marginTop: '24px', padding: '14px 32px', borderRadius: '12px',
                border: 'none', background: '#C0392B',
                color: '#fff', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              ログアウト
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}