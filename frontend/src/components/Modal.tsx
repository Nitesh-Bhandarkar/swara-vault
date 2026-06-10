import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  onClose: () => void
  children: React.ReactNode
  maxWidth?: number
  borderColor?: string
}

export default function Modal({ onClose, children, maxWidth = 520, borderColor = 'rgba(201,168,76,0.2)' }: Props) {
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [])

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'modal-fade-in 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#15112A',
          border: `1px solid ${borderColor}`,
          borderRadius: '1rem',
          width: '100%', maxWidth: `${maxWidth}px`,
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          animation: 'modal-slide-up 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
