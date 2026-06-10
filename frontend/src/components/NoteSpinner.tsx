export default function NoteSpinner({ color = 'currentColor' }: { color?: string }) {
  return (
    <span aria-label="Loading" style={{ display: 'inline-flex', gap: '2px', alignItems: 'center', verticalAlign: 'middle' }}>
      {['♩', '♪', '♫'].map((note, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            color,
            animation: 'note-bounce 1.1s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
            lineHeight: 1,
          }}
        >
          {note}
        </span>
      ))}
    </span>
  )
}
