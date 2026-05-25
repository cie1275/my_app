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

function weatherEmoji(telop: string) {
  if (telop.includes('晴') && telop.includes('雨')) return '🌦'
  if (telop.includes('晴') && telop.includes('曇')) return '⛅'
  if (telop.includes('晴')) return '☀️'
  if (telop.includes('雨')) return '🌧'
  if (telop.includes('雪')) return '❄️'
  if (telop.includes('曇')) return '☁️'
  return '🌤'
}

function dressAdvice(telop: string, maxTemp: string | null) {
  const temp = Number(maxTemp)
  if (isNaN(temp)) return ''
  if (temp >= 30) return '真夏日・ノースリーブや半袖がおすすめ'
  if (temp >= 25) return '薄手の半袖がおすすめ'
  if (temp >= 20) return '薄手の羽織りがおすすめ'
  if (temp >= 15) return '長袖・軽いアウターがおすすめ'
  if (temp >= 10) return 'しっかりしたアウターを'
  return '防寒対策をしっかりと'
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
        if (onWeatherLoaded && json.data?.forecasts?.[0]) {
          const today = json.data.forecasts[0]
          onWeatherLoaded(today.telop, today.temperature.max.celsius ?? '20')
        }
      } catch {
        setError('天気の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    fetchWeather()
  }, [prefecture])

  if (loading) return (
    <div style={{ margin: '12px 16px', padding: '20px', background: '#fff', borderRadius: '16px', color: '#aaa', fontSize: '13px' }}>
      天気を取得中...
    </div>
  )
  if (error) return (
    <div style={{ margin: '12px 16px', padding: '20px', background: '#fff', borderRadius: '16px', color: '#e74c3c', fontSize: '13px' }}>
      {error}
    </div>
  )
  if (!weather) return null

  const today = weather.forecasts[0]
  const emoji = weatherEmoji(today.telop)
  const advice = dressAdvice(today.telop, today.temperature.max.celsius)

  return (
    <div style={{
      margin: '12px 16px',
      background: '#fff',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* 地域 */}
      <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '12px', letterSpacing: '0.05em' }}>
        {weather.title}
      </p>

      {/* メイン天気 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <span style={{ fontSize: '48px', lineHeight: 1 }}>{emoji}</span>
        <div>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#1A2238', lineHeight: 1, marginBottom: '4px' }}>
            {today.temperature.max.celsius ?? '--'}℃
          </p>
          <p style={{ fontSize: '13px', color: '#888' }}>{today.telop}</p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: '#e74c3c', marginBottom: '2px' }}>
            最高 {today.temperature.max.celsius ?? '--'}℃
          </p>
          <p style={{ fontSize: '12px', color: '#3498db' }}>
            最低 {today.temperature.min.celsius ?? '--'}℃
          </p>
        </div>
      </div>

      {/* 服装アドバイス */}
      {advice && (
        <div style={{
          background: '#F6F4F0',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '14px',
        }}>
          <p style={{ fontSize: '12px', color: '#5C5143' }}>👕 {advice}</p>
        </div>
      )}

      {/* 降水確率 */}
      <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
        <p style={{ fontSize: '11px', color: '#AAA', marginBottom: '8px' }}>降水確率</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: '0-6時', value: today.chanceOfRain.T00_06 },
            { label: '6-12時', value: today.chanceOfRain.T06_12 },
            { label: '12-18時', value: today.chanceOfRain.T12_18 },
            { label: '18-24時', value: today.chanceOfRain.T18_24 },
          ].map((r, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#BBB', marginBottom: '2px' }}>{r.label}</p>
              <p style={{ fontSize: '13px', fontWeight: '600', color: r.value === '--' || r.value === '0%' ? '#CCC' : '#3498db' }}>
                {r.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}