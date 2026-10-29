// app/page.tsx
'use client'

import { useState } from 'react'
import BottomNav from '../components/BottomNav'
import WeatherCard from '../components/WeatherCard'
import CoordCard from '../components/CoordCard'
import HomeSuggestCard from '../components/HomeSuggestCard'
import ImageUpload from '../components/ImageUpload'

export default function Home() {
  const [prefecture, setPrefecture] = useState<string>('東京都')
  const [weather, setWeather] = useState<string>('')
  const [temperature, setTemperature] = useState<string>('')

  return (
    <main style={{
      background: '#FAFAFA',
      minHeight: '100dvh',
      paddingBottom: '80px',
    }}>
      {/* ヘッダー */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px 12px',
        background: '#fff',
        borderBottom: '1px solid #F0F0F0',
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '700',
          letterSpacing: '0.12em',
          color: '#1A2238',
          margin: 0,
        }}>
          L'Atelier
        </h1>
        <button style={{
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: '#555',
        }}>
          🔔
        </button>
      </header>

      {/* 現在地 */}
      <CoordCard onPrefectureFound={setPrefecture} />

      {/* 天気 (weather, temperatureが変更されたら親の状態を更新するコールバックを渡す) */}
      <WeatherCard 
        prefecture={prefecture} 
        onWeatherLoaded={(w, t) => {
          setWeather(w)
          setTemperature(t)
        }} 
      />

      {/* 今日のコーディネート提案 */}
      <HomeSuggestCard weather={weather} temperature={temperature} />

      {/* 服のアップロード */}
      <ImageUpload
        label="服の画像をアップロード"
        mode="coordinate"
        onUploadComplete={() => {}}
      />

      <BottomNav />
    </main>
  )
}