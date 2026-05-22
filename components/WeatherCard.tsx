// components/WeatherCard.tsx
'use client'

import { useEffect, useState } from 'react'
import { getCityCode } from '../lib/cityCode'

type WeatherData = {
  title: string
  forecasts: {
    date: string
    dateLabel: string
    telop: string
    temperature: {
      min: { celsius: string | null }
      max: { celsius: string | null }
    }
    chanceOfRain: {
      T00_06: string
      T06_12: string
      T12_18: string
      T18_24: string
    }
  }[]
}

type Props = {
  prefecture: string
  onWeatherLoaded?: (telop: string, temperature: string) => void
}

export default function WeatherCard({ prefecture, onWeatherLoaded }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cityId = getCityCode(prefecture)
    setLoading(true)

    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?cityId=${cityId}`)
        const json = await res.json()
        setWeather(json.data)

        // 親コンポーネントに天気データを渡す
        if (onWeatherLoaded && json.data?.forecasts?.[0]) {
          const today = json.data.forecasts[0]
          onWeatherLoaded(
            today.telop,
            today.temperature.max.celsius ?? '20'
          )
        }
      } catch {
        setError('天気の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    fetchWeather()
  }, [prefecture])

  if (loading) return <p>天気を取得中...</p>
  if (error) return <p>{error}</p>
  if (!weather) return null

  const today = weather.forecasts[0]

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
        {weather.title}
      </h2>
      <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        {today.telop}
      </p>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
        <span style={{ color: '#e74c3c' }}>
          最高 {today.temperature.max.celsius ?? '--'}℃
        </span>
        <span style={{ color: '#3498db' }}>
          最低 {today.temperature.min.celsius ?? '--'}℃
        </span>
      </div>
      <div style={{ fontSize: '13px', color: '#555' }}>
        <p>降水確率</p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <span>0-6時: {today.chanceOfRain.T00_06}</span>
          <span>6-12時: {today.chanceOfRain.T06_12}</span>
          <span>12-18時: {today.chanceOfRain.T12_18}</span>
          <span>18-24時: {today.chanceOfRain.T18_24}</span>
        </div>
      </div>
    </div>
  )
}