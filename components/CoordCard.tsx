// components/CoordCard.tsx
'use client'

import { useEffect, useState } from 'react'

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

          fetch('/api/coordinates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

  if (loading) return <p>現在地を取得中...</p>
  if (error) return <p>{error}</p>
  if (!location) return null

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '360px',
      margin: '16px auto',
    }}>
      <h2 style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
        現在地
      </h2>
      <p style={{ fontSize: '20px', fontWeight: 'bold' }}>
        {location.prefecture}
      </p>
      <p style={{ fontSize: '16px', color: '#555' }}>
        {location.city}
      </p>
    </div>
  )
}