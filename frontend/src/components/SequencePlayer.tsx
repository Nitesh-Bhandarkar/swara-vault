import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { acquirePlayback, releasePlayback } from '../utils/audioCoordinator'

export interface SequencePlayerHandle {
  seek: (t: number) => void
}

interface Props {
  urls: string[]
  onActiveIndex?: (idx: number | null) => void
  onTimeUpdate?: (time: number, duration: number) => void
  onSpeedChange?: (speed: number) => void
}

const SPEEDS = [1, 1.25, 1.5, 2]

const SequencePlayer = forwardRef<SequencePlayerHandle, Props>(function SequencePlayer(
  { urls, onActiveIndex, onTimeUpdate, onSpeedChange }, ref
) {
  const audioRef          = useRef<HTMLAudioElement>(null)
  const indexRef          = useRef(0)
  const speedRef          = useRef(1)
  const onActiveIndexRef  = useRef(onActiveIndex)
  const onTimeUpdateRef   = useRef(onTimeUpdate)
  const onSpeedChangeRef  = useRef(onSpeedChange)
  const [playing, setPlaying] = useState(false)
  const [index, setIndex]     = useState(0)
  const [speed, setSpeed]     = useState(1)

  useEffect(() => { onActiveIndexRef.current = onActiveIndex })
  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate })
  useEffect(() => { onSpeedChangeRef.current = onSpeedChange })

  useImperativeHandle(ref, () => ({
    seek: (t: number) => {
      const a = audioRef.current
      if (!a) return
      a.currentTime = t
      onTimeUpdateRef.current?.(t, a.duration)
    },
  }))

  const resetState = () => {
    indexRef.current = 0
    setIndex(0)
  }

  const stopSelf = useCallback(() => {
    audioRef.current?.pause()
    setPlaying(false)
    resetState()
    onActiveIndexRef.current?.(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => releasePlayback(stopSelf), [stopSelf])

  const playFrom = (idx: number) => {
    const a = audioRef.current
    if (!a) return
    indexRef.current = idx
    setIndex(idx)
    onActiveIndexRef.current?.(idx)
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
    onActiveIndexRef.current?.(null)
  }

  const goPrev = () => playFrom((indexRef.current - 1 + urls.length) % urls.length)
  const goNext = () => playFrom((indexRef.current + 1) % urls.length)

  const changeSpeed = (s: number) => {
    speedRef.current = s
    setSpeed(s)
    if (audioRef.current) audioRef.current.playbackRate = s
    onSpeedChangeRef.current?.(s)
  }

  const handleEnded = () => playFrom((indexRef.current + 1) % urls.length)

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
    <div style={{ marginBottom: '0.15rem' }}>

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
            {/* Track indicator */}
            <span style={{ fontSize: '0.72rem', color: '#C9A84C', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ♪ {index + 1}/{urls.length}
            </span>

            {/* Prev / Next */}
            {urls.length > 1 && (
              <button
                onClick={goPrev}
                title="Previous recording"
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
                ⏮ Prev
              </button>
            )}
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

      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => stop()}
        onTimeUpdate={() => {
          const t = audioRef.current?.currentTime ?? 0
          onTimeUpdateRef.current?.(t, audioRef.current?.duration ?? 0)
        }}
        onLoadedMetadata={() => {
          const a = audioRef.current
          if (!a) return
          a.playbackRate = speedRef.current
          onTimeUpdateRef.current?.(0, a.duration)
        }}
      />
    </div>
  )
})

export default SequencePlayer
