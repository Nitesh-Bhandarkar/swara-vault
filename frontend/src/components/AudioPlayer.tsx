import { useRef, useState } from 'react'

interface Props { url: string; label?: string }

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

const SPEEDS = [1, 1.25, 1.5, 2]

export default function AudioPlayer({ url, label }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying]       = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]     = useState(0)
  const [speed, setSpeed]           = useState(1)

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    playing ? a.pause() : a.play()
    setPlaying(!playing)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current
    if (!a) return
    const t = parseFloat(e.target.value)
    a.currentTime = t
    setCurrentTime(t)
  }

  const changeSpeed = (s: number) => {
    if (audioRef.current) audioRef.current.playbackRate = s
    setSpeed(s)
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: '220px', maxWidth: '380px' }}>
      {label && (
        <span style={{ fontSize: '0.78rem', color: '#92785E', letterSpacing: '0.04em' }}>{label}</span>
      )}

      {/* Play + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
            fontSize: '0.8rem', fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.2s',
            letterSpacing: '0.03em',
            boxShadow: playing ? '0 0 12px rgba(217,119,6,0.4)' : 'none',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '1rem' }}>{playing ? '⏸' : '▶'}</span>
          {playing ? 'Pause' : 'Play'}
        </button>

        <span style={{
          fontSize: '0.72rem', color: 'rgba(201,168,76,0.55)',
          fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
        }}>
          {fmt(currentTime)} / {fmt(duration)}
        </span>
      </div>

      {/* Seek bar */}
      <input
        type="range"
        className="sv-seek"
        min={0}
        max={duration || 0}
        step={0.05}
        value={currentTime}
        onChange={handleSeek}
        style={{
          background: `linear-gradient(to right, #C9A84C ${pct}%, rgba(201,168,76,0.15) ${pct}%)`,
        }}
      />

      {/* Speed controls */}
      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.68rem', color: 'rgba(201,168,76,0.4)', letterSpacing: '0.08em', marginRight: '0.1rem' }}>SPEED</span>
        {SPEEDS.map(s => (
          <button
            key={s}
            onClick={() => changeSpeed(s)}
            style={{
              fontSize: '0.7rem', padding: '0.15rem 0.45rem',
              borderRadius: '0.35rem',
              border: `1px solid ${speed === s ? '#C9A84C' : 'rgba(201,168,76,0.2)'}`,
              background: speed === s ? 'rgba(201,168,76,0.15)' : 'transparent',
              color: speed === s ? '#E8C96A' : 'rgba(201,168,76,0.45)',
              cursor: 'pointer', transition: 'all 0.15s', fontWeight: speed === s ? 600 : 400,
            }}
          >
            {s}×
          </button>
        ))}
      </div>

      <audio
        ref={audioRef}
        src={url}
        onEnded={() => { setPlaying(false); setCurrentTime(0) }}
        onPause={() => setPlaying(false)}
        onError={() => setPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
      />
    </div>
  )
}
