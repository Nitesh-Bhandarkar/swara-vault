import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { login } from '../api/auth'
import NoteSpinner from '../components/NoteSpinner'

export default function LoginPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await login(form.username, form.password)
      // Pre-populate the ['me'] cache so ProtectedRoute renders immediately
      // without needing a second GET /auth/me request. This eliminates the
      // race condition on mobile where the session cookie hasn't been
      // committed to the cookie store before the next request fires.
      qc.setQueryData(['me'], data)
      navigate('/')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(160deg, #0D0A1A 0%, #1E1246 40%, #2D0F1E 70%, #0D0A1A 100%)',
      }}
    >
      {/* Floating notes background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {['♩','♪','♫','♬','♭','♯','𝄞','♩','♫','♪'].map((note, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              left: `${8 + i * 9.5}%`,
              top: `${10 + (i % 4) * 22}%`,
              fontSize: `${1.2 + (i % 3) * 0.5}rem`,
              color: `rgba(201,168,76,${0.05 + (i % 4) * 0.03})`,
              fontFamily: 'serif',
              animation: `float-note ${3.5 + (i % 3)}s ease-in-out infinite ${i * 0.4}s`,
            }}
          >
            {note}
          </span>
        ))}
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
              boxShadow: '0 0 32px rgba(201,168,76,0.4)',
            }}
          >
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>𝄞</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#E8C96A', fontSize: '2rem', fontWeight: 700, margin: 0 }}>
            Swara Vault
          </h1>
          <p style={{ color: 'rgba(201,168,76,0.5)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0.25rem 0 0' }}>
            Carnatic Music Reference
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: '1.25rem',
            padding: '2rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.9)', fontSize: '1.3rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 400, letterSpacing: '0.02em' }}>
            Welcome back
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label style={{ display: 'block', color: 'rgba(201,168,76,0.8)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Username
              </label>
              <input
                type="text" autoFocus required
                className="sv-input"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', borderColor: 'rgba(201,168,76,0.2)' }}
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="mb-5">
              <label style={{ display: 'block', color: 'rgba(201,168,76,0.8)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                type="password" required
                className="sv-input"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', borderColor: 'rgba(201,168,76,0.2)' }}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            {error && (
              <p style={{ color: '#FCA5A5', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className="btn-gold" style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? <><NoteSpinner /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'rgba(201,168,76,0.45)', fontSize: '0.85rem' }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#E8C96A', textDecoration: 'none', fontWeight: 500 }}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
