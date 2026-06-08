import { useRef, useState } from 'react'

interface Props { url: string; label?: string }

export default function AudioPlayer({ url, label }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    playing ? audio.pause() : audio.play()
    setPlaying(!playing)
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      {label && <span style={{ fontSize: '0.78rem', color: '#92785E', letterSpacing: '0.04em' }}>{label}</span>}
      <button
        onClick={toggle}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: playing
            ? 'linear-gradient(135deg, #92400e, #d97706)'
            : 'linear-gradient(135deg, #1E1246, #2D0F1E)',
          color: '#E8C96A',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '999px',
          padding: '0.3rem 0.9rem',
          fontSize: '0.8rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s',
          letterSpacing: '0.03em',
          boxShadow: playing ? '0 0 12px rgba(217,119,6,0.4)' : 'none',
        }}
      >
        <span style={{ fontSize: '1rem' }}>{playing ? '⏸' : '▶'}</span>
        {playing ? 'Pause' : 'Play'}
      </button>
      <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} />
    </div>
  )
}
