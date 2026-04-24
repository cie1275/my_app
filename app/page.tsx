// app/page.tsx
import BottomNav from "../components/BottomNav";

export default function Home() {
  return (
    <main style={{ paddingBottom: '100px' }}>
      <h1>ホーム画面</h1>
      <p>Next.js 16 (Turbopack) が正常に起動しました！</p>
      
      {/* 下部ナビゲーションを表示 */}
      <BottomNav />
    </main>
  );
}