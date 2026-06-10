import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createRaga, updateRaga, getRaga, getMelakarataRagas } from '../api/ragas'
import type { Raga } from '../types'
import Layout from '../components/Layout'
import AudioUpload from '../components/AudioUpload'

interface FormState {
  name: string; janya: boolean; janakaRagaId: string
  melakarataNumber: string; arohana: string; arohanaAudioUrl: string
  avarohana: string; avarohanaAudioUrl: string
}
const emptyForm = (): FormState => ({
  name: '', janya: false, janakaRagaId: '', melakarataNumber: '',
  arohana: '', arohanaAudioUrl: '', avarohana: '', avarohanaAudioUrl: '',
})

export default function RagaFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== 'new' && id !== undefined
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>(emptyForm())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  // After a new raga is created, hold its ID so we can show audio upload before navigating
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createdForm, setCreatedForm] = useState<{ arohanaAudioUrl: string; avarohanaAudioUrl: string }>({ arohanaAudioUrl: '', avarohanaAudioUrl: '' })

  const { data: raga } = useQuery({
    queryKey: ['raga', id],
    queryFn: () => getRaga(id!).then(r => r.data),
    enabled: isEdit,
  })
  const { data: melakarataRagas } = useQuery({
    queryKey: ['melakarta'],
    queryFn: () => getMelakarataRagas().then(r => r.data),
  })

  useEffect(() => {
    if (raga) setForm({
      name: raga.name, janya: raga.janya,
      janakaRagaId: raga.janakaRagaId ?? '', melakarataNumber: raga.melakarataNumber?.toString() ?? '',
      arohana: raga.arohana ?? '', arohanaAudioUrl: raga.arohanaAudioUrl ?? '',
      avarohana: raga.avarohana ?? '', avarohanaAudioUrl: raga.avarohanaAudioUrl ?? '',
    })
  }, [raga])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    const payload = {
      name: form.name, janya: form.janya,
      janakaRagaId: form.janya ? form.janakaRagaId || undefined : undefined,
      melakarataNumber: !form.janya ? parseInt(form.melakarataNumber) || undefined : undefined,
      arohana: form.arohana || undefined, arohanaAudioUrl: form.arohanaAudioUrl || undefined,
      avarohana: form.avarohana || undefined, avarohanaAudioUrl: form.avarohanaAudioUrl || undefined,
    }
    try {
      if (isEdit) {
        await updateRaga(id!, payload)
        qc.invalidateQueries({ queryKey: ['raga', id] })
        qc.invalidateQueries({ queryKey: ['ragas'] })
        navigate(`/ragas/${id}`)
      } else {
        const { data } = await createRaga(payload)
        qc.invalidateQueries({ queryKey: ['ragas'] })
        setCreatedId(data.id)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleFinishCreate = async () => {
    if (!createdId) return
    // Save audio URLs if uploaded
    if (createdForm.arohanaAudioUrl || createdForm.avarohanaAudioUrl) {
      try {
        await updateRaga(createdId, {
          arohanaAudioUrl: createdForm.arohanaAudioUrl || undefined,
          avarohanaAudioUrl: createdForm.avarohanaAudioUrl || undefined,
        })
      } catch { /* ignore audio save errors */ }
    }
    navigate(`/ragas/${createdId}`)
  }

  const f = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const label = (text: string) => (
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
      {text}
    </label>
  )

  // After creating a new raga, show audio upload phase
  if (createdId) {
    return (
      <Layout>
        <div style={{ maxWidth: '680px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#E8C96A', margin: '0 0 0.5rem', fontWeight: 700 }}>
            Raga Created!
          </h1>
          <p style={{ color: 'rgba(240,228,200,0.5)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            Optionally upload audio for Arohana and Avarohana, then click Done.
          </p>
          <div className="sv-card mb-5 p-6">
            <div className="ornament mb-5">
              <span style={{ fontSize: '0.78rem', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Audio (Optional)</span>
            </div>
            <div className="mb-4">
              {label('Arohana Audio')}
              <AudioUpload
                ragaId={createdId}
                existingUrl={createdForm.arohanaAudioUrl || null}
                onUploaded={url => setCreatedForm(f => ({ ...f, arohanaAudioUrl: url }))}
                label="arohana audio"
              />
            </div>
            <div>
              {label('Avarohana Audio')}
              <AudioUpload
                ragaId={createdId}
                existingUrl={createdForm.avarohanaAudioUrl || null}
                onUploaded={url => setCreatedForm(f => ({ ...f, avarohanaAudioUrl: url }))}
                label="avarohana audio"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleFinishCreate} className="btn-gold" style={{ padding: '0.7rem 2rem', fontSize: '0.95rem' }}>
              Done →
            </button>
            <button onClick={() => navigate(`/ragas/${createdId}`)} className="btn-outline" style={{ padding: '0.7rem 1.5rem', fontSize: '0.95rem' }}>
              Skip
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '680px' }}>
        <Link to={isEdit ? `/ragas/${id}` : '/'} style={{ color: 'rgba(201,168,76,0.7)', fontSize: '0.85rem', textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#E8C96A', margin: '0.75rem 0 1.75rem', fontWeight: 700 }}>
          {isEdit ? 'Edit Raga' : 'Add New Raga'}
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Basic info */}
          <div className="sv-card mb-5 p-6">
            <div className="ornament mb-5">
              <span style={{ fontSize: '0.78rem', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Identity</span>
            </div>
            <div className="mb-4">
              {label('Name *')}
              <input type="text" required className="sv-input" value={form.name} onChange={f('name')} placeholder="e.g. Shankarabharanam" />
            </div>
            <div className="mb-4">
              {label('Type *')}
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[false, true].map(v => (
                  <label key={String(v)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.6rem 1.1rem', border: `1.5px solid ${form.janya === v ? '#C9A84C' : 'rgba(201,168,76,0.2)'}`, borderRadius: '0.6rem', background: form.janya === v ? 'rgba(201,168,76,0.08)' : 'transparent', transition: 'all 0.2s' }}>
                    <input type="radio" name="janya" checked={form.janya === v} onChange={() => setForm(p => ({ ...p, janya: v }))} style={{ accentColor: '#C9A84C' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: form.janya === v ? 600 : 400, color: form.janya === v ? '#E8C96A' : 'rgba(240,228,200,0.45)' }}>
                      {v ? 'Janya' : 'Melakarta'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {form.janya ? (
              <div>
                {label('Janaka Raga *')}
                <select required className="sv-input" value={form.janakaRagaId} onChange={f('janakaRagaId')}>
                  <option value="">Select Janaka Raga…</option>
                  {melakarataRagas?.map((r: Raga) => (
                    <option key={r.id} value={r.id}>{r.name} (#{r.melakarataNumber})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                {label('Melakarta Number (1–72) *')}
                <input type="number" required min={1} max={72} className="sv-input" value={form.melakarataNumber} onChange={f('melakarataNumber')} style={{ maxWidth: '160px' }} />
              </div>
            )}
          </div>

          {/* Swaras */}
          <div className="sv-card mb-5 p-6">
            <div className="ornament mb-5">
              <span style={{ fontSize: '0.78rem', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Swaras</span>
            </div>
            <div className="mb-4">
              {label('Arohana')}
              <input type="text" className="sv-input" style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }} value={form.arohana} onChange={f('arohana')} placeholder="S R2 G3 M1 P D2 N3 S'" />
              {isEdit && <div className="mt-2"><AudioUpload ragaId={id!} existingUrl={form.arohanaAudioUrl || null} onUploaded={url => setForm(p => ({ ...p, arohanaAudioUrl: url }))} label="arohana audio" /></div>}
            </div>
            <div>
              {label('Avarohana')}
              <input type="text" className="sv-input" style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }} value={form.avarohana} onChange={f('avarohana')} placeholder="S' N3 D2 P M1 G3 R2 S" />
              {isEdit && <div className="mt-2"><AudioUpload ragaId={id!} existingUrl={form.avarohanaAudioUrl || null} onUploaded={url => setForm(p => ({ ...p, avarohanaAudioUrl: url }))} label="avarohana audio" /></div>}
            </div>
            {!isEdit && <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'rgba(240,228,200,0.3)', fontStyle: 'italic' }}>Audio upload available on the next step after saving.</p>}
          </div>

          {error && (
            <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.6rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#9f1239', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" disabled={saving} className="btn-gold" style={{ padding: '0.7rem 2rem', fontSize: '0.95rem' }}>
              {saving ? '♩ Saving…' : isEdit ? 'Save changes' : 'Add Raga'}
            </button>
            <Link to={isEdit ? `/ragas/${id}` : '/'} className="btn-outline" style={{ padding: '0.7rem 1.5rem', fontSize: '0.95rem', textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  )
}
