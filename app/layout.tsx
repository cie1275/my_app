// app/layout.tsx
import type { Viewport } from 'next'
import StyledJsxRegistry from '../lib/registry'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <StyledJsxRegistry>
          <div className="app-shell">{children}</div>
        </StyledJsxRegistry>
      </body>
    </html>
  )
}