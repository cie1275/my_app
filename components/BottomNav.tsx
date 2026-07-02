// components/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'ホーム', icon: '🏠' },
    { href: '/coorde', label: 'コーデ', icon: '👗' },
    { href: '/community', label: 'コミュニティ', icon: '👥' },
    { href: '/closet', label: 'クローゼット', icon: '👔' },
    { href: '/favorites', label: 'お気に入り', icon: '❤️' },
    { href: '/profile', label: 'プロフィール', icon: '👤' },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#fff', borderTop: '1px solid #F0F0F0',
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 0 12px', zIndex: 100,
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '2px',
              textDecoration: 'none', minWidth: '48px',
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
            <span style={{
              fontSize: '9px',
              color: isActive ? '#1A2238' : '#AAA',
              fontWeight: isActive ? '600' : '400',
              letterSpacing: '0.02em',
            }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}