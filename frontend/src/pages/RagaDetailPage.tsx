import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getRaga, deleteRaga } from '../api/ragas'
import Layout from '../components/Layout'
import AudioPlayer from '../components/AudioPlayer'
import CompositionSection from '../components/CompositionSection'
import NoteSpinner from '../components/NoteSpinner'

export default function RagaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const { data: raga, isLoading } = useQuery({
    queryKey: ['raga', id],
    queryFn: () => getRaga(id!).then(r => r.data),
  })

  const handleDelete = async () => {
    if (!raga || !id) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteRaga(id)
      qc.invalidateQueries({ queryKey: ['ragas'] })
      navigate('/')
    } catch (err: any) {
      setDeleting(false)
      setDeleteError(err.response?.data?.message || 'Delete failed. Please try again.')
    }
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ['raga', id] })

  if (isLoading) return (
    <Layout>
      <div className="text-center py-24" style={{ color: 'rgba(201,168,76,0.6)', fontSize: '2rem' }}>
        <span className="note-float" style={{ display: 'inline-block' }}>♩</span>
        <span className="note-float-2" style={{ display: 'inline-block', margin: '0 0.5rem' }}>♪</span>
        <span className="note-float-3" style={{ display: 'inline-block' }}>♫</span>
      </div>
    </Layout>
  )
  if (!raga) return <Layout><p style={{ textAlign: 'center', color: '#7C6B5E', padding: '3rem' }}>Raga not found.</p></Layout>

  return (
    <Layout>
      <Link to="/" style={{ color: 'rgba(201,168,76,0.7)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.5rem' }}>
        ← All Ragas
      </Link>

      {/* Hero header */}
      <div
        className="sv-card mb-4"
        style={{
          background: 'linear-gradient(135deg, #1E1246 0%, #2D0F1E 60%, #1E1246 100%)',
          border: '1px solid rgba(201,168,76,0.25)',
          padding: '2rem 2.5rem',
          position: 'relative',
        }}
      >
        {/* Decorative notes — contained in their own overflow:hidden layer */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '1rem', pointerEvents: 'none' }}>
          <div className="absolute right-8 top-4 hidden md:flex gap-5 opacity-20">
            <span className="note-float" style={{ color: '#E8C96A', fontSize: '2.5rem', fontFamily: 'serif' }}>𝄞</span>
            <span className="note-float-2" style={{ color: '#E8C96A', fontSize: '1.8rem', fontFamily: 'serif' }}>♫</span>
            <span className="note-float-3" style={{ color: '#E8C96A', fontSize: '2rem', fontFamily: 'serif' }}>♪</span>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={raga.janya ? 'badge-janya' : 'badge-mela'}>{raga.janya ? 'Janya' : 'Janaka'}</span>
              {!raga.janya && <span style={{ color: 'rgba(201,168,76,0.6)', fontSize: '0.85rem' }}>Mela #{raga.melakarataNumber}</span>}
              {raga.seeded && <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: '0.75rem', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '999px', padding: '0.1rem 0.5rem' }}>Seeded</span>}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color: '#E8C96A', margin: '0 0 0.4rem', letterSpacing: '-0.01em' }}>
              {raga.name}
            </h1>
            {raga.janya && raga.janakaRagaId && (
              <p style={{ color: 'rgba(201,168,76,0.6)', fontSize: '0.9rem', margin: 0 }}>
                Janaka:{' '}
                <Link to={`/ragas/${raga.janakaRagaId}`} style={{ color: '#E8C96A', fontWeight: 600, textDecoration: 'none' }}>
                  {raga.janakaRagaName} →
                </Link>
              </p>
            )}
          </div>
          <div className="shrink-0 mt-1">
            <Link to={`/ragas/${id}/edit`} className="btn-outline" style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', textDecoration: 'none' }}>
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Delete action — outside the hero card to avoid any overflow/stacking issues */}
      <div style={{ marginBottom: '1.5rem' }}>
        {!confirmDelete ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setConfirmDelete(true); setDeleteError('') }}
              style={{
                fontSize: '0.82rem', padding: '0.4rem 0.9rem',
                background: 'transparent',
                border: '1.5px solid rgba(239,68,68,0.35)',
                color: 'rgba(252,165,165,0.75)',
                borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.65)'; e.currentTarget.style.color = '#fca5a5' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; e.currentTarget.style.color = 'rgba(252,165,165,0.75)' }}
            >
              Delete Raga
            </button>
          </div>
        ) : (
            <div style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1.5px solid rgba(239,68,68,0.3)',
              borderRadius: '0.75rem',
              padding: '1rem 1.25rem',
            }}>
              <p style={{ color: 'rgba(252,165,165,0.9)', fontSize: '0.88rem', margin: '0 0 0.75rem', fontWeight: 500 }}>
                Permanently delete "{raga.name}"? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    fontSize: '0.85rem', padding: '0.5rem 1.2rem',
                    background: 'rgba(239,68,68,0.15)',
                    border: '1.5px solid rgba(239,68,68,0.6)',
                    color: '#fca5a5', borderRadius: '0.5rem',
                    cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600,
                    opacity: deleting ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}
                >
                  {deleting ? <><NoteSpinner color="#fca5a5" /> Deleting…</> : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => { setConfirmDelete(false); setDeleteError('') }}
                  style={{
                    fontSize: '0.85rem', padding: '0.5rem 1.2rem',
                    background: 'transparent',
                    border: '1.5px solid rgba(201,168,76,0.25)',
                    color: 'rgba(201,168,76,0.7)', borderRadius: '0.5rem', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                {deleteError && (
                  <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>{deleteError}</span>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Arohana / Avarohana */}
      <div className="sv-card mb-6 p-6" style={{ background: '#15112A' }}>
        <div className="ornament mb-5"><span style={{ fontSize: '0.85rem', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', fontWeight: 500, fontFamily: 'var(--font-body)' }}>Swaras</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p style={{ color: 'rgba(201,168,76,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: '0.5rem' }}>↑ Arohana</p>
            <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: raga.arohana ? '#E8C96A' : 'rgba(240,228,200,0.3)', fontStyle: raga.arohana ? 'normal' : 'italic', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
              {raga.arohana || 'Not set yet'}
            </p>
            {raga.arohanaAudioUrl && <AudioPlayer url={raga.arohanaAudioUrl} />}
          </div>
          <div>
            <p style={{ color: 'rgba(201,168,76,0.7)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: '0.5rem' }}>↓ Avarohana</p>
            <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: raga.avarohana ? '#E8C96A' : 'rgba(240,228,200,0.3)', fontStyle: raga.avarohana ? 'normal' : 'italic', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
              {raga.avarohana || 'Not set yet'}
            </p>
            {raga.avarohanaAudioUrl && <AudioPlayer url={raga.avarohanaAudioUrl} />}
          </div>
        </div>
      </div>

      {/* Compositions — order: Geethe, Varna, Kruthi, Keertane */}
      <div className="sv-card p-6" style={{ background: '#15112A' }}>
        <div className="ornament mb-6">
          <span style={{ fontSize: '0.85rem', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
            Compositions
          </span>
        </div>
        {(['GEETHE', 'VARNA', 'KRUTHI', 'KEERTANE'] as const).map(type => (
          <CompositionSection
            key={type}
            ragaId={id!}
            type={type}
            title={type.charAt(0) + type.slice(1).toLowerCase()}
            compositions={raga.compositions}
            onChanged={refresh}
          />
        ))}
      </div>
    </Layout>
  )
}
