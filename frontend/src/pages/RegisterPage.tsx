import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import NoteSpinner from '../components/NoteSpinner'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(form.username, form.email, form.password)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(160deg, #0D0A1A 0%, #1E1246 40%, #2D0F1E 70%, #0D0A1A 100%)' }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {['♩','♫','♬','♭','♪','♯','𝄞','♩'].map((note, i) => (
          <span key={i} className="absolute" style={{
            left: `${5 + i * 12}%`, top: `${15 + (i % 3) * 25}%`,
            fontSize: `${1 + (i % 3) * 0.4}rem`,
            color: `rgba(201,168,76,${0.04 + (i % 4) * 0.025})`,
            fontFamily: 'serif',
            animation: `float-note ${3.5 + (i % 3)}s ease-in-out infinite ${i * 0.5}s`,
          }}>{note}</span>
        ))}
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96A)', boxShadow: '0 0 32px rgba(201,168,76,0.4)' }}>
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>𝄞</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#E8C96A', fontSize: '2rem', fontWeight: 700, margin: 0 }}>
            Swara Vault
          </h1>
          <p style={{ color: 'rgba(201,168,76,0.5)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0.25rem 0 0' }}>
            Carnatic Music Reference
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '1.25rem', padding: '2rem', backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.9)', fontSize: '1.3rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 400 }}>
            Create account
          </h2>
          <form onSubmit={handleSubmit}>
            {(['username', 'email', 'password', 'confirmPassword'] as const).map((field) => (
              <div key={field} className="mb-4">
                <label style={{ display: 'block', color: 'rgba(201,168,76,0.8)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {field === 'confirmPassword' ? 'Confirm Password' : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === 'password' || field === 'confirmPassword' ? 'password' : field === 'email' ? 'email' : 'text'}
                  required
                  minLength={field === 'password' || field === 'confirmPassword' ? 8 : field === 'username' ? 3 : 0}
                  maxLength={field === 'username' ? 50 : undefined}
                  autoFocus={field === 'username'}
                  className="sv-input"
                  style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', borderColor: 'rgba(201,168,76,0.2)' }}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                />
              </div>
            ))}
            {error && <p style={{ color: '#FCA5A5', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn-gold" style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? <><NoteSpinner /> Creating account…</> : 'Create account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'rgba(201,168,76,0.45)', fontSize: '0.85rem' }}>
            Have an account?{' '}
            <Link to="/login" style={{ color: '#E8C96A', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
