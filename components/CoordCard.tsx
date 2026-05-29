// components/CoordCard.tsx
'use client'

import { useEffect, useState } from 'react'
import { getUserId } from '../lib/cognito'


type Location = {
  prefecture: string
  city: string
  latitude: number
  longitude: number
}

type Props = {
  onPrefectureFound: (prefecture: string) => void
}

export default function CoordCard({ onPrefectureFound }: Props) {
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = new Date()
  const dateStr = today.toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('位置情報がサポートされていません')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ja`
          )
          const data = await res.json()
          const prefecture = data.address?.state ?? data.address?.province ?? '東京都'
          const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? '不明'
          setLocation({ prefecture, city, latitude, longitude })
          onPrefectureFound(prefecture)

          const userId = await getUserId()
        fetch('/api/coordinates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {}),
          },
          body: JSON.stringify({ latitude, longitude, timestamp: new Date().toISOString() }),
        }).catch(err => console.error('座標保存エラー:', err))
        } catch {
          setError('住所の取得に失敗しました')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('位置情報の取得が拒否されました')
        setLoading(false)
      }
    )
  }, [])

  return (
    <div style={{
      margin: '16px 16px 0',
      padding: '16px 20px',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '4px', letterSpacing: '0.05em' }}>
          {dateStr}
        </p>
        {loading ? (
          <p style={{ fontSize: '16px', color: '#CCC' }}>現在地を取得中...</p>
        ) : error ? (
          <p style={{ fontSize: '14px', color: '#e74c3c' }}>{error}</p>
        ) : location ? (
          <div>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#1A2238', lineHeight: 1.2 }}>
              {location.prefecture}
            </p>
            <p style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
              {location.city}
            </p>
          </div>
        ) : null}
      </div>
      <span style={{ fontSize: '24px' }}>📍</span>
    </div>
  )
}