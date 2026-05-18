// app/page.tsx
'use client'

import { useState } from 'react'
import BottomNav from "../components/BottomNav";
import WeatherCard from "../components/WeatherCard";
import CoordCard from "../components/CoordCard";
import ImageUpload from "../components/ImageUpload";

export default function Home() {
  const [prefecture, setPrefecture] = useState<string>('東京都')

  return (
    <main style={{ paddingBottom: '100px' }}>
      <h1>ホーム画面</h1>
      <CoordCard onPrefectureFound={setPrefecture} />
      <WeatherCard prefecture={prefecture} />
      <ImageUpload
        label="服の画像をアップロード"
        mode="coordinate"
        onUploadComplete={(url, key, analysis) => {
          console.log('アップロード完了:', url, key, analysis)
        }}
      />
      <BottomNav />
    </main>
  );
}