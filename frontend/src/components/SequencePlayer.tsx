import { useCallback, useEffect, useRef, useState } from 'react'
import { acquirePlayback, releasePlayback } from '../utils/audioCoordinator'

interface Props { urls: string[] }

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

export default function SequencePlayer({ urls }: Props) {
  const audioRef  = useRef<HTMLAudioElement>(null)
  const indexRef  = useRef(0)
  const [playing, setPlaying]         = useState(false)
  const [index, setIndex]             = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)

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

  // When a track ends, advance to the next (loop back to 0 after the last)
  const handleEnded = () => {
    playFrom((indexRef.current + 1) % urls.length)
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div style={{
      marginTop: '0.6rem',
      paddingTop: '0.55rem',
      borderTop: '1px solid rgba(201,168,76,0.1)',
      display: 'flex', flexDirection: 'column', gap: '0.35rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
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
            <span style={{ fontSize: '0.72rem', color: '#C9A84C', fontWeight: 600 }}>
              ♪ {index + 1} / {urls.length}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(201,168,76,0.5)', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </>
        )}
      </div>

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
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
      />
    </div>
  )
}
