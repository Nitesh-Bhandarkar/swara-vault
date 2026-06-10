import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { logout } from '../api/auth'
import NoteSpinner from './NoteSpinner'

const NAV_LINKS = [
  { to: '/', label: 'Ragas' },
  { to: '/import', label: 'Import' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    qc.clear()
    navigate('/login')
  }

  const instruments = [
    { icon: '🪕', top: '8%',  left: '1.5%', size: '7rem',  opacity: 0.4, rotate: '-20deg' },
    { icon: '🥁', top: '20%', right: '1%',  size: '6rem',  opacity: 0.4, rotate: '10deg'  },
    { icon: '🎻', top: '45%', left: '0.5%', size: '6.5rem',opacity: 0.4, rotate: '15deg'  },
    { icon: '🪘', top: '63%', right: '1.5%',size: '6rem',  opacity: 0.4, rotate: '-12deg' },
    { icon: '🎷', top: '79%', left: '2%',   size: '5.5rem',opacity: 0.4, rotate: '25deg'  },
    { icon: '🎺', top: '89%', right: '2%',  size: '5.5rem',opacity: 0.4, rotate: '-8deg'  },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', position: 'relative', overflow: 'hidden' }}>
      {/* Instrument background decorations */}
      {instruments.map((inst, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: inst.top,
            left: 'left' in inst ? inst.left : undefined,
            right: 'right' in inst ? inst.right : undefined,
            fontSize: inst.size,
            opacity: inst.opacity,
            transform: `rotate(${inst.rotate})`,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0,
            lineHeight: 1,
          }}
        >
          {inst.icon}
        </span>
      ))}
      {/* Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #0D0A1A 0%, #1E1246 45%, #2D0F1E 100%)',
          borderBottom: '1px solid rgba(201,168,76,0.25)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        }}
        className="sticky top-0 z-50"
      >
        {/* Thin gold shimmer line at top */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #C9A84C, #E8C96A, #C9A84C, transparent)' }} />

        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" style={{ textDecoration: 'none' }}>
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
                boxShadow: '0 0 16px rgba(201,168,76,0.5)',
              }}
            >
              <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>𝄞</span>
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  background: 'linear-gradient(90deg, #E8C96A, #C9A84C, #E8C96A)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Swara Vault
              </span>
              <p style={{ color: 'rgba(201,168,76,0.55)', fontSize: '0.65rem', letterSpacing: '0.2em', margin: 0, textTransform: 'uppercase' }}>
                Carnatic Music
              </p>
            </div>
          </Link>

          {/* Floating notes decoration */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <span className="note-float" style={{ color: 'rgba(201,168,76,0.25)', fontSize: '1.4rem' }}>♩</span>
            <span className="note-float-2" style={{ color: 'rgba(201,168,76,0.2)', fontSize: '1.1rem' }}>♪</span>
            <span className="note-float-3" style={{ color: 'rgba(201,168,76,0.25)', fontSize: '1.3rem' }}>♫</span>
            <span className="note-float" style={{ color: 'rgba(201,168,76,0.2)', fontSize: '1rem', animationDelay: '0.5s' }}>♬</span>
            <span className="note-float-2" style={{ color: 'rgba(201,168,76,0.25)', fontSize: '1.2rem', animationDelay: '1.5s' }}>♩</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  color: location.pathname === link.to ? '#E8C96A' : 'rgba(201,168,76,0.65)',
                  fontWeight: location.pathname === link.to ? 600 : 400,
                  fontSize: '0.875rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: location.pathname === link.to ? 'rgba(201,168,76,0.12)' : 'transparent',
                  letterSpacing: '0.02em',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/ragas/new"
              className="btn-gold ml-2"
              style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', textDecoration: 'none' }}
            >
              + Add Raga
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                color: 'rgba(201,168,76,0.45)',
                fontSize: '0.8rem',
                background: 'transparent',
                border: 'none',
                cursor: loggingOut ? 'not-allowed' : 'pointer',
                padding: '0.4rem 0.6rem',
                letterSpacing: '0.02em',
                transition: 'color 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}
              onMouseOver={e => { if (!loggingOut) e.currentTarget.style.color = 'rgba(201,168,76,0.85)' }}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(201,168,76,0.45)')}
            >
              {loggingOut ? <NoteSpinner color="rgba(201,168,76,0.6)" /> : 'Logout'}
            </button>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-6 py-10" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 mt-8" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}>
        <p style={{ color: 'rgba(139,120,100,0.5)', fontSize: '0.75rem', letterSpacing: '0.15em', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
          ♩ &nbsp; रागसंग्रह &nbsp; ♪ &nbsp; Raga Sangraha &nbsp; ♫
        </p>
      </footer>
    </div>
  )
}
