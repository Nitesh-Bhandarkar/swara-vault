import { useEffect, useState } from 'react'
import type { Composition, CompositionType } from '../types'
import AudioPlayer from './AudioPlayer'
import AudioUpload from './AudioUpload'
import NoteSpinner from './NoteSpinner'
import { addComposition, updateComposition, deleteComposition } from '../api/ragas'

interface Props {
  ragaId: string
  type: CompositionType
  title: string
  compositions: Composition[]
  onChanged: () => void
}

const empty = (type: CompositionType): Omit<Composition, 'id'> => ({
  type, name: '', tala: '', description: '', audioUrl: null,
})

const TYPE_COLORS: Record<CompositionType, { bg: string; border: string; text: string; dot: string }> = {
  GEETHE:   { bg: 'rgba(30,58,138,0.18)',  border: 'rgba(147,197,253,0.2)', text: '#93c5fd', dot: '#3b82f6' },
  KRUTHI:   { bg: 'rgba(120,53,15,0.22)',  border: 'rgba(253,186,116,0.2)', text: '#fdba74', dot: '#f97316' },
  KEERTANE: { bg: 'rgba(20,83,45,0.2)',    border: 'rgba(134,239,172,0.2)', text: '#86efac', dot: '#22c55e' },
  VARNA:    { bg: 'rgba(76,29,149,0.22)',  border: 'rgba(216,180,254,0.2)', text: '#d8b4fe', dot: '#a855f7' },
}

export default function CompositionSection({ ragaId, type, title, compositions, onChanged }: Props) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Composition, 'id'>>(empty(type))
  const [open, setOpen] = useState(true)
  const [saveError, setSaveError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ name: false, tala: false })
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Clear refreshing indicator when parent passes updated compositions back
  useEffect(() => { setRefreshing(false) }, [compositions])

  const items = compositions.filter(c => c.type === type)
  const colors = TYPE_COLORS[type]

  const resetForm = () => {
    setForm(empty(type))
    setAdding(false)
    setEditingId(null)
    setSaveError('')
    setFieldErrors({ name: false, tala: false })
  }

  const startEdit = (c: Composition) => {
    setForm({ type: c.type, name: c.name, tala: c.tala, description: c.description, audioUrl: c.audioUrl })
    setEditingId(c.id)
    setAdding(false)
    setSaveError('')
    setFieldErrors({ name: false, tala: false })
  }

  const handleSave = async () => {
    const errors = { name: !form.name.trim(), tala: !form.tala.trim() }
    if (errors.name || errors.tala) { setFieldErrors(errors); return }
    setFieldErrors({ name: false, tala: false })
    setSaveError('')
    setSaving(true)
    try {
      if (editingId) await updateComposition(ragaId, editingId, form)
      else await addComposition(ragaId, form)
      resetForm()
      setRefreshing(true)
      onChanged()
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Save failed. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteComposition(ragaId, id)
      setConfirmDeleteId(null)
      setRefreshing(true)
      onChanged()
    } catch {
      // leave confirm open so user can retry
    } finally {
      setDeletingId(null)
    }
  }

  const showForm = adding || editingId !== null

  const inputStyle = (hasError: boolean) => ({
    fontSize: '0.875rem',
    borderColor: hasError ? '#ef4444' : undefined,
    boxShadow: hasError ? '0 0 0 1px #ef4444' : undefined,
  })

  return (
    <div className="mb-5">
      {/* Section header */}
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
          {!showForm && (
            <span
              onClick={e => { e.stopPropagation(); setAdding(true); setOpen(true) }}
              style={{ fontSize: '0.78rem', color: colors.text, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
            >
              + Add
            </span>
          )}
          <span style={{ color: '#a89880', fontSize: '0.9rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="mt-3">
          {/* Shimmer bar while list is refreshing after a save/delete */}
          {refreshing && (
            <div style={{
              height: '2px',
              borderRadius: '2px',
              marginBottom: '0.5rem',
              background: 'linear-gradient(90deg, transparent 0%, #C9A84C 40%, #E8C96A 50%, #C9A84C 60%, transparent 100%)',
              backgroundSize: '200% auto',
              animation: 'shimmer-bar 1.2s linear infinite',
            }} />
          )}

          {items.length === 0 && !showForm && (
            <p style={{ color: 'rgba(240,228,200,0.3)', fontSize: '0.85rem', fontStyle: 'italic', paddingLeft: '1rem', margin: '0.5rem 0 1rem' }}>
              No {title.toLowerCase()} added yet.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: showForm ? '1rem' : 0 }}>
            {items.map(c => (
              <div key={c.id} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', padding: '1rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: '#F0E4C8', margin: '0 0 0.2rem', fontSize: '0.95rem', fontFamily: 'var(--font-display)' }}>{c.name}</p>
                  <p style={{ fontSize: '0.78rem', color: colors.text, margin: '0 0 0.35rem', fontWeight: 500 }}>Tala: {c.tala}</p>
                  {c.description && <p style={{ fontSize: '0.82rem', color: 'rgba(240,228,200,0.55)', margin: '0 0 0.5rem' }}>{c.description}</p>}
                  {c.audioUrl && <AudioPlayer url={c.audioUrl} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', marginLeft: '1rem', flexShrink: 0 }}>
                  {confirmDeleteId === c.id ? (
                    <>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(252,165,165,0.85)', whiteSpace: 'nowrap' }}>Delete?</span>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.45)', color: '#fca5a5', borderRadius: '0.35rem', cursor: deletingId === c.id ? 'not-allowed' : 'pointer', minWidth: '54px' }}
                        >
                          {deletingId === c.id ? <NoteSpinner color="#fca5a5" /> : 'Yes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={!!deletingId}
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'transparent', border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(201,168,76,0.6)', borderRadius: '0.35rem', cursor: 'pointer' }}
                        >
                          No
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => startEdit(c)} style={{ fontSize: '0.75rem', color: 'rgba(240,228,200,0.45)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
                      <button onClick={() => setConfirmDeleteId(c.id)} style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showForm && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${colors.border}`, borderRadius: '0.75rem', padding: '1.1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: fieldErrors.name ? '#ef4444' : 'rgba(201,168,76,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                    Name *
                  </label>
                  <input
                    className="sv-input"
                    style={inputStyle(fieldErrors.name)}
                    value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFieldErrors(fe => ({ ...fe, name: false })) }}
                  />
                  {fieldErrors.name && <p style={{ color: '#ef4444', fontSize: '0.72rem', margin: '0.25rem 0 0' }}>Name is required</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: fieldErrors.tala ? '#ef4444' : 'rgba(201,168,76,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                    Tala *
                  </label>
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
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#92785E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Description</label>
                <textarea className="sv-input" rows={2} style={{ resize: 'vertical', fontSize: '0.875rem' }} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              {ragaId !== 'new' && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <AudioUpload ragaId={ragaId} compositionId={editingId ?? undefined} existingUrl={form.audioUrl} onUploaded={url => setForm(f => ({ ...f, audioUrl: url }))} label="audio" />
                </div>
              )}
              {saveError && <p style={{ color: '#FCA5A5', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{saveError}</p>}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-gold"
                  style={{ fontSize: '0.85rem', padding: '0.45rem 1.1rem', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  {saving ? <><NoteSpinner /> Saving…</> : 'Save'}
                </button>
                <button type="button" onClick={resetForm} disabled={saving} className="btn-outline" style={{ fontSize: '0.85rem', padding: '0.45rem 1.1rem' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
