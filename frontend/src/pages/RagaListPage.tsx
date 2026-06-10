import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchRagas } from '../api/ragas'
import type { Raga } from '../types'
import Layout from '../components/Layout'

export default function RagaListPage() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [janyaFilter, setJanyaFilter] = useState<'all' | 'janya' | 'melakarta'>('all')
  const [page, setPage] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const janya = janyaFilter === 'all' ? undefined : janyaFilter === 'janya'

  const { data, isLoading } = useQuery({
    queryKey: ['ragas', debouncedQ, janya, page],
    queryFn: () => searchRagas(debouncedQ || undefined, janya, page).then(r => r.data),
    placeholderData: prev => prev,
  })

  return (
    <Layout>
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="ornament mb-4"><span>♩ ♪ ♫</span></div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 700, color: '#E8C96A', margin: '0 0 0.5rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Raga Sangraha
        </h1>
        <p style={{ color: 'rgba(240,228,200,0.55)', fontSize: '1rem', fontStyle: 'italic', fontFamily: 'var(--font-display)', margin: '0 0 0.25rem' }}>
          Explore the treasury of Carnatic Ragas
        </p>
        {data && (
          <p style={{ color: 'rgba(201,168,76,0.7)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            {data.totalElements} Ragas catalogued
          </p>
        )}
        <div className="ornament mt-4"><span>♫ ♬ ♭</span></div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-7" style={{ maxWidth: '640px', margin: '0 auto 1.75rem' }}>
        <div className="flex-1 relative">
          <span className="absolute" style={{ left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,168,76,0.5)', fontSize: '1rem' }}>♪</span>
          <input
            type="search"
            placeholder="Search Ragas by name…"
            className="sv-input"
            style={{ paddingLeft: '2.2rem' }}
            value={q}
            onChange={e => { setQ(e.target.value); setPage(0) }}
          />
        </div>
        <select
          className="sv-input"
          style={{ width: 'auto', minWidth: '140px' }}
          value={janyaFilter}
          onChange={e => { setJanyaFilter(e.target.value as any); setPage(0) }}
        >
          <option value="all">All Ragas</option>
          <option value="melakarta">Janaka</option>
          <option value="janya">Janya</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'rgba(201,168,76,0.6)', fontSize: '1.5rem' }}>
          <span className="note-float" style={{ display: 'inline-block' }}>♩</span>
          <span className="note-float-2" style={{ display: 'inline-block', margin: '0 0.5rem' }}>♪</span>
          <span className="note-float-3" style={{ display: 'inline-block' }}>♫</span>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {data?.content.map((raga: Raga) => (
              <Link
                key={raga.id}
                to={`/ragas/${raga.id}`}
                className="sv-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem 1.4rem',
                  textDecoration: 'none',
                  borderLeft: `3px solid ${raga.janya ? '#D97706' : '#1d4ed8'}`,
                }}
              >
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: '#F0E4C8', margin: '0 0 0.2rem' }}>
                    {raga.name}
                  </p>
                  {raga.janya ? (
                    <p style={{ fontSize: '0.78rem', color: '#fdba74', margin: 0 }}>
                      Janaka: <span style={{ fontWeight: 600 }}>{raga.janakaRagaName}</span>
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.78rem', color: '#93c5fd', margin: 0 }}>
                      Melakarta <span style={{ fontWeight: 600 }}>#{raga.melakarataNumber}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {(raga.arohana || raga.avarohana) && (
                    <span style={{ fontSize: '0.75rem', color: 'rgba(201,168,76,0.6)', fontFamily: 'monospace', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {raga.arohana}
                    </span>
                  )}
                  <span className={raga.janya ? 'badge-janya' : 'badge-mela'}>
                    {raga.janya ? 'Janya' : 'Janaka'}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {data?.content.length === 0 && (
            <div className="text-center py-16">
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>♩</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'rgba(240,228,200,0.45)', fontStyle: 'italic' }}>No ragas found.</p>
              <Link to="/ragas/new" style={{ color: '#C9A84C', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'underline' }}>Add the first one</Link>
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                ← Prev
              </button>
              <span style={{ color: 'rgba(240,228,200,0.45)', fontSize: '0.85rem' }}>{page + 1} / {data.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages - 1} className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
