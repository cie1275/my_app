"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
    <path
      d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
      stroke={active ? "#1A1A18" : "#B4B2A9"}
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill={active ? "#F1EFE8" : "none"}
    />
  </svg>
);

const CoordIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
    <rect x="3" y="3" width="8" height="10" rx="2" stroke={active ? "#1A1A18" : "#B4B2A9"} strokeWidth="1.4" />
    <rect x="13" y="3" width="8" height="6" rx="2" stroke={active ? "#1A1A18" : "#B4B2A9"} strokeWidth="1.4" />
    <rect x="13" y="12" width="8" height="9" rx="2" stroke={active ? "#1A1A18" : "#B4B2A9"} strokeWidth="1.4" />
    <rect x="3" y="16" width="8" height="5" rx="2" stroke={active ? "#1A1A18" : "#B4B2A9"} strokeWidth="1.4" />
  </svg>
);

const ClosetIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
    <path
      d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z"
      stroke={active ? "#1A1A18" : "#B4B2A9"}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M3 6H21" stroke={active ? "#1A1A18" : "#B4B2A9"} strokeWidth="1.4" />
    <path
      d="M16 10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10"
      stroke={active ? "#1A1A18" : "#B4B2A9"}
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const FavoriteIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
      stroke={active ? "#1A1A18" : "#B4B2A9"}
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill={active ? "#F1EFE8" : "none"}
    />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" width={22} height={22}>
    <circle cx="12" cy="8" r="4" stroke={active ? "#1A1A18" : "#B4B2A9"} strokeWidth="1.4" />
    <path
      d="M4 20C4 17.2 7.6 15 12 15C16.4 15 20 17.2 20 20"
      stroke={active ? "#1A1A18" : "#B4B2A9"}
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "ホーム",
    icon: null, // rendered dynamically
  },
  {
    href: "/coordinates",
    label: "コーデ",
    icon: null,
  },
  {
    href: "/closet",
    label: "クローゼット",
    icon: null,
  },
  {
    href: "/favorites",
    label: "お気に入り",
    icon: null,
  },
  {
    href: "/profile",
    label: "プロフィール",
    icon: null,
  },
];

function NavIcon({ href, active }: { href: string; active: boolean }) {
  switch (href) {
    case "/":
      return <HomeIcon active={active} />;
    case "/coordinates":
      return <CoordIcon active={active} />;
    case "/closet":
      return <ClosetIcon active={active} />;
    case "/favorites":
      return <FavoriteIcon active={active} />;
    case "/profile":
      return <ProfileIcon active={active} />;
    default:
      return null;
  }
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} className={`nav-item${active ? " active" : ""}`}>
            <span className="nav-icon">
              <NavIcon href={href} active={active} />
            </span>
            {active && <span className="nav-dot" />}
            <span className="nav-label">{label}</span>
          </Link>
        );
      })}

      <style jsx>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: #ffffff;
          border-top: 0.5px solid rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 10px 0 max(18px, env(safe-area-inset-bottom));
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex: 1;
          padding: 4px 0;
          text-decoration: none;
          position: relative;
          transition: transform 0.15s ease;
        }

        .nav-item:active {
          transform: scale(0.92);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .nav-item.active .nav-icon {
          background: #F1EFE8;
        }

        .nav-dot {
          position: absolute;
          top: 2px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #1A1A18;
          animation: dotIn 0.2s ease forwards;
        }

        @keyframes dotIn {
          from { opacity: 0; transform: scale(0); }
          to   { opacity: 1; transform: scale(1); }
        }

        .nav-label {
          font-size: 9px;
          letter-spacing: 0.06em;
          color: #B4B2A9;
          font-family: "Noto Sans JP", sans-serif;
          transition: color 0.2s ease;
          white-space: nowrap;
        }

        .nav-item.active .nav-label {
          color: #1A1A18;
          font-weight: 500;
        }

        @media (prefers-color-scheme: dark) {
          .bottom-nav {
            background: #1A1A18;
            border-top-color: rgba(255, 255, 255, 0.08);
          }

          .nav-item.active .nav-icon {
            background: #2C2C2A;
          }

          .nav-dot {
            background: #F7F5F2;
          }

          .nav-item.active .nav-label {
            color: #F7F5F2;
          }
        }
      `}</style>
    </nav>
  );
}