import { useRef, useState } from 'react'
import { getUploadUrl, uploadToR2 } from '../api/ragas'

interface Props {
  ragaId: string
  compositionId?: string
  existingUrl?: string | null
  onUploaded: (publicUrl: string) => void
  label: string
}

export default function AudioUpload({ ragaId, compositionId, existingUrl, onUploaded, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const MPEG_TYPES = ['video/mpeg', 'video/mpg', 'video/x-mpeg']
    if (file.type && !file.type.startsWith('audio/') && !MPEG_TYPES.includes(file.type)) {
      setError('Only audio files accepted'); return
    }
    if (file.size > 50 * 1024 * 1024) { setError('File too large (max 50 MB)'); return }
    setUploading(true); setError('')
    try {
      const { data } = await getUploadUrl(ragaId, file.name, file.type, compositionId)
      await uploadToR2(data.uploadUrl, file)
      onUploaded(data.publicUrl)
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          fontSize: '0.78rem', padding: '0.3rem 0.8rem',
          background: 'transparent',
          border: '1px solid rgba(201,168,76,0.35)',
          color: '#C9A84C',
          borderRadius: '0.4rem', cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: uploading ? 0.55 : 1,
        }}
      >
        {uploading ? '♪ Uploading…' : existingUrl ? `Replace ${label}` : `↑ Upload ${label}`}
      </button>
      {existingUrl && !uploading && (
        <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 500 }}>✓ Audio uploaded</span>
      )}
      {error && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{error}</span>}
      <input ref={inputRef} type="file" accept="audio/*,video/mpeg,video/mpg,video/x-mpeg" className="hidden" onChange={handleFile} />
    </div>
  )
}
