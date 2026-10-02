import { useState } from 'react'

export function AudioArtwork({ src, reading = false }: { src?: string; reading?: boolean }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  return (
    <div
      className="morph-audio__artwork morph-audio__artwork--empty"
      data-loaded={loaded && !failed}
      aria-label={
        loaded && !failed
          ? 'Cover artwork'
          : reading || (src && !failed)
            ? 'Loading cover artwork'
            : 'No cover artwork'
      }
      role="img"
    >
      {src && !failed && (
        <img src={src} alt="" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      )}
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        aria-hidden="true"
      >
        <path d="M9 17V5l11-2v12M9 9l11-2" />
        <ellipse cx="6" cy="17" rx="3" ry="2.5" />
        <ellipse cx="17" cy="15" rx="3" ry="2.5" />
      </svg>
    </div>
  )
}
