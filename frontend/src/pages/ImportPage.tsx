import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { importRagas } from '../api/ragas'
import type { Raga } from '../types'
import Layout from '../components/Layout'

export default function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; ragas: Raga[] } | null>(null)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setImporting(true); setError(''); setResult(null)
    try {
      const { data } = await importRagas(file)
      setResult(data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <Layout>
      <div style={{ maxWidth: '680px' }}>
        <Link to="/" style={{ color: 'rgba(201,168,76,0.7)', fontSize: '0.85rem', textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#E8C96A', margin: '0.75rem 0 0.5rem', fontWeight: 700 }}>
          Import Ragas
        </h1>
        <p style={{ color: 'rgba(240,228,200,0.45)', fontSize: '0.9rem', marginBottom: '2rem', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
          Bulk-add Ragas via CSV or JSON
        </p>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragging ? '#C9A84C' : 'rgba(201,168,76,0.3)'}`,
            borderRadius: '1.25rem',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
            transition: 'all 0.2s',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem', lineHeight: 1 }}>
            {importing
              ? <span className="note-float" style={{ display: 'inline-block', color: '#C9A84C' }}>♫</span>
              : '📂'
            }
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#F0E4C8', fontWeight: 600, marginBottom: '0.3rem' }}>
            {importing ? 'Importing…' : 'Drop a CSV or JSON file here'}
          </p>
          <p style={{ fontSize: '0.82rem', color: 'rgba(240,228,200,0.35)' }}>or click to select from your computer</p>
          <input ref={inputRef} type="file" accept=".csv,.json" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {error && (
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '0.75rem', padding: '0.9rem 1.1rem', marginBottom: '1.25rem', color: '#9f1239', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', border: '1px solid #86EFAC', borderRadius: '1rem', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', color: '#14532d', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              ♫ Imported {result.imported} raga{result.imported !== 1 ? 's' : ''} successfully
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '180px', overflowY: 'auto' }}>
              {result.ragas.map(r => (
                <Link key={r.id} to={`/ragas/${r.id}`} style={{ fontSize: '0.88rem', color: '#166534', fontWeight: 500, textDecoration: 'none' }}>
                  ♪ {r.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Format reference */}
        <div className="sv-card p-6">
          <div className="ornament mb-4"><span style={{ fontSize: '0.78rem', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600, fontFamily: 'var(--font-body)' }}>File Formats</span></div>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>CSV</p>
            <pre style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '0.5rem', padding: '0.9rem', fontSize: '0.78rem', overflowX: 'auto', color: '#E8C96A', fontFamily: 'monospace', lineHeight: 1.6 }}>
{`name,janya,janaka_name,melakarta_number,arohana,avarohana
Bhairavi,true,Natabhairavi,,S R2 G2 M1 P D1 N2 S',S' N2 D1 P M1 G2 R2 S
Hindolam,true,Todi,,S G2 M1 D1 N2 S',S' N2 D1 M1 G2 S`}
            </pre>
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>JSON</p>
            <pre style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '0.5rem', padding: '0.9rem', fontSize: '0.78rem', overflowX: 'auto', color: '#E8C96A', fontFamily: 'monospace', lineHeight: 1.6 }}>
{`[
  {
    "name": "Bhairavi",
    "janya": true,
    "janakaName": "Natabhairavi",
    "arohana": "S R2 G2 M1 P D1 N2 S'",
    "avarohana": "S' N2 D1 P M1 G2 R2 S"
  }
]`}
            </pre>
          </div>
        </div>
      </div>
    </Layout>
  )
}
