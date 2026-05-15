// app/page.tsx
'use client'

import { useState } from 'react'
import BottomNav from "../components/BottomNav";
import WeatherCard from "../components/WeatherCard";
import CoordCard from "../components/CoordCard";

export default function Home() {
  const [prefecture, setPrefecture] = useState<string>('東京都')

  return (
    <main style={{ paddingBottom: '100px' }}>
      <CoordCard onPrefectureFound={setPrefecture} />
      <WeatherCard prefecture={prefecture} />
      <BottomNav />
    </main>
  );
}