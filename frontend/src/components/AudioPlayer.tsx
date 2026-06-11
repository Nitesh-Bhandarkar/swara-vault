import { useCallback, useEffect, useRef, useState } from 'react'
import { acquirePlayback, releasePlayback } from '../utils/audioCoordinator'

interface Props {
  url: string
  label?: string
  sequenceTime?: number
  sequenceDuration?: number
  sequenceSpeed?: number
  onSeek?: (time: number) => void
}

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

const SPEEDS = [1, 1.25, 1.5, 2]

export default function AudioPlayer({ url, label, sequenceTime, sequenceDuration, sequenceSpeed, onSeek }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying]         = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const [speed, setSpeed]             = useState(1)

  const isSequenceActive = sequenceTime !== undefined
  const displayTime      = isSequenceActive ? sequenceTime! : currentTime
  const displayDuration  = isSequenceActive ? sequenceDuration! : duration

  // Stable stop callback registered with the coordinator
  const stopSelf = useCallback(() => {
    audioRef.current?.pause()
    setPlaying(false)
  }, [])

  useEffect(() => () => releasePlayback(stopSelf), [stopSelf])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      releasePlayback(stopSelf)
    } else {
      // Inherit speed from sequence when taking over
      if (isSequenceActive && sequenceSpeed !== undefined) {
        setSpeed(sequenceSpeed)
        a.playbackRate = sequenceSpeed
      }
      acquirePlayback(stopSelf)
      a.play().catch(() => {})
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    if (isSequenceActive) {
      onSeek?.(t)
    } else {
      const a = audioRef.current
      if (!a) return
      a.currentTime = t
      setCurrentTime(t)
    }
  }

  const changeSpeed = (s: number) => {
    if (audioRef.current) audioRef.current.playbackRate = s
    setSpeed(s)
  }

  const showAsPlaying = playing || isSequenceActive
  const pct = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: '220px', maxWidth: '380px' }}>
      {label && (
        <span style={{ fontSize: '0.78rem', color: '#92785E', letterSpacing: '0.04em' }}>{label}</span>
      )}

      {/* Play / Pause + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <button
          onClick={toggle}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: showAsPlaying
              ? 'linear-gradient(135deg, #92400e, #d97706)'
              : 'linear-gradient(135deg, #1E1246, #2D0F1E)',
            color: '#E8C96A',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: '999px',
            padding: '0.3rem 0.9rem',
            fontSize: '0.8rem', fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.2s',
            letterSpacing: '0.03em',
            boxShadow: showAsPlaying ? '0 0 12px rgba(217,119,6,0.4)' : 'none',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '1rem' }}>{showAsPlaying ? '⏸' : '▶'}</span>
          {showAsPlaying ? 'Pause' : 'Play'}
        </button>

        <span style={{ fontSize: '0.72rem', color: 'rgba(201,168,76,0.55)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {fmt(displayTime)} / {fmt(displayDuration)}
        </span>
      </div>

      {/* Seek bar */}
      <input
        type="range" className="sv-seek"
        min={0} max={displayDuration || 0} step={0.05} value={displayTime}
        onChange={handleSeek}
        style={{ background: `linear-gradient(to right, #C9A84C ${pct}%, rgba(201,168,76,0.15) ${pct}%)` }}
      />

      {/* Speed controls — read-only while sequence controls playback */}
      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.68rem', color: 'rgba(201,168,76,0.4)', letterSpacing: '0.08em', marginRight: '0.1rem' }}>SPEED</span>
        {SPEEDS.map(s => {
          const activeSpeed = isSequenceActive && sequenceSpeed !== undefined ? sequenceSpeed : speed
          const isActive = activeSpeed === s
          return (
            <button
              key={s}
              onClick={isSequenceActive ? undefined : () => changeSpeed(s)}
              style={{
                fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '0.35rem',
                border: `1px solid ${isActive ? '#C9A84C' : 'rgba(201,168,76,0.2)'}`,
                background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: isActive ? '#E8C96A' : 'rgba(201,168,76,0.45)',
                cursor: isSequenceActive ? 'default' : 'pointer',
                transition: 'all 0.15s', fontWeight: isActive ? 600 : 400,
              }}
            >
              {s}×
            </button>
          )
        })}
      </div>

      <audio
        ref={audioRef}
        src={url}
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => { setPlaying(false); releasePlayback(stopSelf) }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
      />
    </div>
  )
}
