import { useState } from 'react'

export function AudioArtwork({ src, reading = false }: { src?: string; reading?: boolean }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const shown = loaded && !failed
  return (
    <div
      className="morph-audio__artwork"
      data-loaded={shown}
      data-reading={!shown && (reading || (!!src && !failed))}
      role="img"
      aria-label={
        shown
          ? 'Cover artwork'
          : reading || (src && !failed)
            ? 'Loading cover artwork'
            : 'No cover artwork'
      }
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

/** A blurred copy of the artwork that tints the card; hidden until the image loads. */
export function AudioBackdrop({ src }: { src?: string }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <div className="morph-audio__backdrop" aria-hidden="true" data-loaded={loaded && !failed}>
      {src && !failed && (
        <img src={src} alt="" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      )}
    </div>
  )
}
