import { useEffect, useState } from 'react'
import type { Composition, CompositionType } from '../types'
import AudioPlayer from './AudioPlayer'
import AudioUpload from './AudioUpload'
import Modal from './Modal'
import NoteSpinner from './NoteSpinner'
import SequencePlayer from './SequencePlayer'
import { addComposition, updateComposition, deleteComposition } from '../api/ragas'

interface Props {
  ragaId: string
  type: CompositionType
  title: string
  compositions: Composition[]
  onChanged: () => void
}

const empty = (type: CompositionType): Omit<Composition, 'id'> => ({
  type, name: '', tala: '', description: '', audioUrls: [],
})

const TYPE_COLORS: Record<CompositionType, { bg: string; border: string; text: string; dot: string }> = {
  GEETHE:   { bg: 'rgba(30,58,138,0.18)',  border: 'rgba(147,197,253,0.2)', text: '#93c5fd', dot: '#3b82f6' },
  KRUTHI:   { bg: 'rgba(120,53,15,0.22)',  border: 'rgba(253,186,116,0.2)', text: '#fdba74', dot: '#f97316' },
  KEERTANE: { bg: 'rgba(20,83,45,0.2)',    border: 'rgba(134,239,172,0.2)', text: '#86efac', dot: '#22c55e' },
  VARNA:    { bg: 'rgba(76,29,149,0.22)',  border: 'rgba(216,180,254,0.2)', text: '#d8b4fe', dot: '#a855f7' },
}

export default function CompositionSection({ ragaId, type, title, compositions, onChanged }: Props) {
  const [open, setOpen] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Which composition has an active SequencePlayer, and what track/time it's on
  const [seqState, setSeqState] = useState<{ compId: string; idx: number; time: number; duration: number } | null>(null)

  // Which modal is visible
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | null>(null)
  // Composition being edited or deleted
  const [activeComposition, setActiveComposition] = useState<Composition | null>(null)

  // Form state (shared by add and edit modals)
  const [form, setForm] = useState<Omit<Composition, 'id'>>(empty(type))
  const [saveError, setSaveError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ name: false, tala: false })
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { setRefreshing(false) }, [compositions])

  const items = compositions.filter(c => c.type === type)
  const colors = TYPE_COLORS[type]

  const closeModal = () => {
    if (saving || deleting) return
    setModalMode(null)
    setActiveComposition(null)
    setSaveError('')
    setFieldErrors({ name: false, tala: false })
  }

  const openAdd = () => {
    setForm(empty(type))
    setSaveError('')
    setFieldErrors({ name: false, tala: false })
    setActiveComposition(null)
    setModalMode('add')
  }

  const openEdit = (c: Composition) => {
    setForm({ type: c.type, name: c.name, tala: c.tala, description: c.description, audioUrls: c.audioUrls ?? [] })
    setSaveError('')
    setFieldErrors({ name: false, tala: false })
    setActiveComposition(c)
    setModalMode('edit')
  }

  const openDelete = (c: Composition) => {
    setActiveComposition(c)
    setModalMode('delete')
  }

  const handleSave = async () => {
    const errors = { name: !form.name.trim(), tala: !form.tala.trim() }
    if (errors.name || errors.tala) { setFieldErrors(errors); return }
    setFieldErrors({ name: false, tala: false })
    setSaveError('')
    setSaving(true)
    try {
      if (modalMode === 'edit' && activeComposition) {
        await updateComposition(ragaId, activeComposition.id, form)
      } else {
        await addComposition(ragaId, form)
      }
      setModalMode(null)
      setActiveComposition(null)
      setRefreshing(true)
      onChanged()
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Save failed. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activeComposition) return
    setDeleting(true)
    try {
      await deleteComposition(ragaId, activeComposition.id)
      setModalMode(null)
      setActiveComposition(null)
      setRefreshing(true)
      onChanged()
    } catch {
      // keep modal open so user can retry
    } finally {
      setDeleting(false)
    }
  }

  const inputStyle = (hasError: boolean) => ({
    fontSize: '0.875rem',
    borderColor: hasError ? '#ef4444' : undefined,
    boxShadow: hasError ? '0 0 0 1px #ef4444' : undefined,
  })

  const fieldLabel = (text: string, color = 'rgba(201,168,76,0.65)') => (
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
      {text}
    </label>
  )

  return (
    <div className="mb-5">

      {/* ── Add / Edit modal ───────────────────────────────────────── */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <Modal onClose={closeModal} maxWidth={520} borderColor={colors.border}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.4rem 0.9rem', borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.dot, display: 'inline-block', flexShrink: 0 }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: colors.text, margin: 0, fontWeight: 600 }}>
                {modalMode === 'edit' ? `Edit ${title}` : `Add ${title}`}
              </h2>
            </div>
            {!saving && (
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', color: 'rgba(240,228,200,0.4)', fontSize: '1.15rem', cursor: 'pointer', lineHeight: 1, padding: '0.15rem 0.4rem', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F0E4C8')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,228,200,0.4)')}
              >✕</button>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '1.25rem 1.4rem 1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                {fieldLabel('Name *', fieldErrors.name ? '#ef4444' : undefined)}
                <input
                  className="sv-input"
                  style={inputStyle(fieldErrors.name)}
                  value={form.name}
                  autoFocus
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFieldErrors(fe => ({ ...fe, name: false })) }}
                />
                {fieldErrors.name && <p style={{ color: '#ef4444', fontSize: '0.72rem', margin: '0.25rem 0 0' }}>Name is required</p>}
              </div>
              <div>
                {fieldLabel('Tala *', fieldErrors.tala ? '#ef4444' : undefined)}
                <input
                  className="sv-input"
                  style={inputStyle(fieldErrors.tala)}
                  value={form.tala}
                  onChange={e => { setForm(f => ({ ...f, tala: e.target.value })); setFieldErrors(fe => ({ ...fe, tala: false })) }}
                />
                {fieldErrors.tala && <p style={{ color: '#ef4444', fontSize: '0.72rem', margin: '0.25rem 0 0' }}>Tala is required</p>}
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              {fieldLabel('Description', '#92785E')}
              <textarea
                className="sv-input"
                rows={3}
                style={{ resize: 'vertical', fontSize: '0.875rem' }}
                value={form.description ?? ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {ragaId !== 'new' && (
              <div style={{ marginBottom: '0.75rem' }}>
                {fieldLabel('Audio Files')}
                {form.audioUrls.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' }}>
                    {form.audioUrls.map((_, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500 }}>✓ File {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, audioUrls: f.audioUrls.filter((__, i) => i !== idx) }))}
                          style={{ fontSize: '0.7rem', color: 'rgba(239,68,68,0.75)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <AudioUpload
                  ragaId={ragaId}
                  compositionId={activeComposition?.id}
                  existingUrl={null}
                  onUploaded={url => setForm(f => ({ ...f, audioUrls: [...f.audioUrls, url] }))}
                  label="audio file"
                />
              </div>
            )}

            {saveError && <p style={{ color: '#FCA5A5', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>{saveError}</p>}

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-gold"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.3rem', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                {saving ? <><NoteSpinner /> Saving…</> : 'Save'}
              </button>
              <button type="button" onClick={closeModal} disabled={saving} className="btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirmation modal ──────────────────────────────── */}
      {modalMode === 'delete' && activeComposition && (
        <Modal onClose={closeModal} maxWidth={400} borderColor="rgba(239,68,68,0.25)">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.4rem 0.9rem', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#fca5a5', margin: 0, fontWeight: 600 }}>
              Delete {title}
            </h2>
            {!deleting && (
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', color: 'rgba(240,228,200,0.4)', fontSize: '1.15rem', cursor: 'pointer', lineHeight: 1, padding: '0.15rem 0.4rem', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F0E4C8')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,228,200,0.4)')}
              >✕</button>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '1.25rem 1.4rem 1.5rem' }}>
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.6rem', padding: '0.8rem 1rem', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#F0E4C8', fontFamily: 'var(--font-display)' }}>
                {activeComposition.name}
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: colors.text }}>Tala: {activeComposition.tala}</p>
            </div>
            <p style={{ color: 'rgba(240,228,200,0.5)', fontSize: '0.85rem', margin: '0 0 1.25rem' }}>
              This will permanently remove the {title.toLowerCase()} and any associated recordings from this raga. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  fontSize: '0.85rem', padding: '0.5rem 1.3rem',
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.45)',
                  color: '#fca5a5', borderRadius: '0.5rem',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  fontWeight: 600,
                }}
              >
                {deleting ? <><NoteSpinner color="#fca5a5" /> Deleting…</> : 'Delete'}
              </button>
              <button type="button" onClick={closeModal} disabled={deleting} className="btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Section header ─────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0',
          borderBottom: `2px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.dot, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: colors.text }}>
            {title}
          </span>
          {items.length > 0 && (
            <span style={{ fontSize: '0.7rem', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '999px', padding: '0.1rem 0.5rem', fontWeight: 600 }}>
              {items.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            onClick={e => { e.stopPropagation(); openAdd() }}
            style={{ fontSize: '0.78rem', color: colors.text, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
          >
            + Add
          </span>
          <span style={{ color: '#a89880', fontSize: '0.9rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* ── Composition list ───────────────────────────────────────── */}
      {open && (
        <div className="mt-3">
          {refreshing && (
            <div style={{
              height: '2px', borderRadius: '2px', marginBottom: '0.5rem',
              background: 'linear-gradient(90deg, transparent 0%, #C9A84C 40%, #E8C96A 50%, #C9A84C 60%, transparent 100%)',
              backgroundSize: '200% auto',
              animation: 'shimmer-bar 1.2s linear infinite',
            }} />
          )}

          {items.length === 0 && (
            <p style={{ color: 'rgba(240,228,200,0.3)', fontSize: '0.85rem', fontStyle: 'italic', paddingLeft: '1rem', margin: '0.5rem 0 1rem' }}>
              No {title.toLowerCase()} added yet.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {items.map(c => (
              <div
                key={c.id}
                style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', padding: '1rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: '#F0E4C8', margin: '0 0 0.2rem', fontSize: '0.95rem', fontFamily: 'var(--font-display)' }}>{c.name}</p>
                  <p style={{ fontSize: '0.78rem', color: colors.text, margin: '0 0 0.35rem', fontWeight: 500 }}>Tala: {c.tala}</p>
                  {c.description && <p style={{ fontSize: '0.82rem', color: 'rgba(240,228,200,0.55)', margin: '0 0 0.5rem' }}>{c.description}</p>}
                  {c.audioUrls?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {c.audioUrls.length > 1 && (
                        <SequencePlayer
                          urls={c.audioUrls}
                          onActiveIndex={idx => {
                            if (idx === null) {
                              setSeqState(prev => prev?.compId === c.id ? null : prev)
                            } else {
                              setSeqState(prev => ({ compId: c.id, idx, time: prev?.compId === c.id ? prev.time : 0, duration: prev?.compId === c.id ? prev.duration : 0 }))
                            }
                          }}
                          onTimeUpdate={(time, duration) => {
                            setSeqState(prev => prev?.compId === c.id ? { ...prev, time, duration } : prev)
                          }}
                        />
                      )}
                      {c.audioUrls.map((url, i) => (
                        <AudioPlayer
                          key={i}
                          url={url}
                          label={c.audioUrls.length > 1 ? `Recording ${i + 1}` : undefined}
                          sequenceTime={seqState?.compId === c.id && seqState.idx === i ? seqState.time : undefined}
                          sequenceDuration={seqState?.compId === c.id && seqState.idx === i ? seqState.duration : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(c)}
                    style={{ fontSize: '0.75rem', color: 'rgba(240,228,200,0.45)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDelete(c)}
                    style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
