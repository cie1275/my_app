// app/page.tsx
'use client'

import { useState } from 'react'
import BottomNav from "../components/BottomNav";
import WeatherCard from "../components/WeatherCard";
import CoordCard from "../components/CoordCard";
import ImageUpload from "../components/ImageUpload";
import OutfitSuggest from "../components/OutfitSuggest";

type Cloth = {
  id: string
  category: string
  color: string
  season: string
  style: string[]
}

export default function Home() {
  const [prefecture, setPrefecture] = useState<string>('東京都')
  const [weather, setWeather] = useState<string>('')
  const [temperature, setTemperature] = useState<string>('')
  const [clothes, setClothes] = useState<Cloth[]>([])

  const handleUploadComplete = (url: string, key: string, analysis: any) => {
    if (analysis?.items) {
      // コーディネート全体の場合
      const newClothes = analysis.items.map((item: any, i: number) => ({
        id: `${Date.now()}_${i}`,
        category: item.category,
        color: item.color,
        season: item.season,
        style: item.style ?? [],
      }))
      setClothes(prev => [...prev, ...newClothes])
    } else if (analysis) {
      // 服単体の場合
      setClothes(prev => [...prev, {
        id: `${Date.now()}`,
        category: analysis.category,
        color: analysis.color,
        season: analysis.season,
        style: analysis.style ?? [],
      }])
    }
  }

  return (
    <main style={{ paddingBottom: '100px' }}>
      <h1>ホーム画面</h1>
      <CoordCard onPrefectureFound={setPrefecture} />
      <WeatherCard
        prefecture={prefecture}
        onWeatherLoaded={(telop, temp) => {
          setWeather(telop)
          setTemperature(temp)
        }}
      />
      <ImageUpload
        label="服の画像をアップロード"
        mode="coordinate"
        onUploadComplete={handleUploadComplete}
      />
      <OutfitSuggest
        weather={weather}
        temperature={temperature}
        clothes={clothes}
      />
      <BottomNav />
    </main>
  );
}