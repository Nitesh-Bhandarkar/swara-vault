import { useCallback, useEffect, useRef, useState } from 'react'
import { acquirePlayback, releasePlayback } from '../utils/audioCoordinator'

interface Props { urls: string[] }

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

const SPEEDS = [1, 1.25, 1.5, 2]

export default function SequencePlayer({ urls }: Props) {
  const audioRef  = useRef<HTMLAudioElement>(null)
  const indexRef  = useRef(0)
  const speedRef  = useRef(1)
  const [playing, setPlaying]         = useState(false)
  const [index, setIndex]             = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const [speed, setSpeed]             = useState(1)

  const resetState = () => {
    indexRef.current = 0
    setIndex(0)
    setCurrentTime(0)
    setDuration(0)
  }

  const stopSelf = useCallback(() => {
    audioRef.current?.pause()
    setPlaying(false)
    resetState()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => releasePlayback(stopSelf), [stopSelf])

  const playFrom = (idx: number) => {
    const a = audioRef.current
    if (!a) return
    indexRef.current = idx
    setIndex(idx)
    setCurrentTime(0)
    setDuration(0)
    a.src = urls[idx]
    a.load()
    a.play().catch(() => {})
  }

  const startAll = () => {
    acquirePlayback(stopSelf)
    setPlaying(true)
    playFrom(0)
  }

  const stop = () => {
    releasePlayback(stopSelf)
    audioRef.current?.pause()
    setPlaying(false)
    resetState()
  }

  const goNext = () => playFrom((indexRef.current + 1) % urls.length)

  const changeSpeed = (s: number) => {
    speedRef.current = s
    setSpeed(s)
    if (audioRef.current) audioRef.current.playbackRate = s
  }

  const handleEnded = () => playFrom((indexRef.current + 1) % urls.length)

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  const miniBtn = (active: boolean, onClick: () => void, children: React.ReactNode) => (
    <button
      onClick={onClick}
      style={{
        fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '0.3rem',
        border: `1px solid ${active ? '#C9A84C' : 'rgba(201,168,76,0.2)'}`,
        background: active ? 'rgba(201,168,76,0.15)' : 'transparent',
        color: active ? '#E8C96A' : 'rgba(201,168,76,0.45)',
        cursor: 'pointer', transition: 'all 0.15s', fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.15rem' }}>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

        {/* Play All / Stop */}
        <button
          onClick={playing ? stop : startAll}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: playing ? 'rgba(239,68,68,0.1)' : 'rgba(201,168,76,0.1)',
            color: playing ? '#fca5a5' : '#C9A84C',
            border: `1px solid ${playing ? 'rgba(239,68,68,0.3)' : 'rgba(201,168,76,0.35)'}`,
            borderRadius: '999px',
            padding: '0.28rem 0.85rem',
            fontSize: '0.78rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
            letterSpacing: '0.03em', flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '0.88rem' }}>{playing ? '⏹' : '▶'}</span>
          {playing ? 'Stop' : 'Play All'}
        </button>

        {playing && (
          <>
            {/* Track + time */}
            <span style={{ fontSize: '0.72rem', color: '#C9A84C', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ♪ {index + 1}/{urls.length}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(201,168,76,0.5)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {fmt(currentTime)} / {fmt(duration)}
            </span>

            {/* Next */}
            <button
              onClick={goNext}
              title="Next recording"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                fontSize: '0.7rem', padding: '0.18rem 0.55rem',
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.25)',
                color: 'rgba(201,168,76,0.65)',
                borderRadius: '0.35rem', cursor: 'pointer', transition: 'all 0.15s',
                fontWeight: 500,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#E8C96A' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; e.currentTarget.style.color = 'rgba(201,168,76,0.65)' }}
            >
              ⏭ Next
            </button>

            {/* Speed */}
            <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', marginLeft: '0.1rem' }}>
              {SPEEDS.map(s => miniBtn(speed === s, () => changeSpeed(s), `${s}×`))}
            </div>
          </>
        )}
      </div>

      {/* Seek bar — only while playing */}
      {playing && (
        <input
          type="range" className="sv-seek"
          min={0} max={duration || 0} step={0.05} value={currentTime}
          onChange={e => {
            const a = audioRef.current
            if (!a) return
            const t = parseFloat(e.target.value)
            a.currentTime = t
            setCurrentTime(t)
          }}
          style={{ background: `linear-gradient(to right, #C9A84C ${pct}%, rgba(201,168,76,0.15) ${pct}%)` }}
        />
      )}

      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => stop()}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => {
          const a = audioRef.current
          if (!a) return
          setDuration(a.duration)
          a.playbackRate = speedRef.current
        }}
      />
    </div>
  )
}
