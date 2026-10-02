export type VideoIconName =
  | 'play'
  | 'pause'
  | 'replay'
  | 'volume'
  | 'muted'
  | 'expand'
  | 'collapse'
  | 'upload'
  | 'back'
  | 'pip'
  | 'settings'

export function VideoIcon({ name, size = 20 }: { name: VideoIconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'settings' && (
        <>
          <path d="M4 7h16M4 17h16" />
          <circle cx="9" cy="7" r="3" fill="currentColor" stroke="none" />
          <circle cx="15" cy="17" r="3" fill="currentColor" stroke="none" />
        </>
      )}
      {name === 'pip' && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <rect x="12" y="11" width="7" height="6" rx="1" fill="currentColor" stroke="none" />
        </>
      )}
      {name === 'play' && <path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none" />}
      {name === 'pause' && (
        <>
          <path d="M8 5v14M16 5v14" strokeWidth="4" />
        </>
      )}
      {name === 'replay' && (
        <>
          <path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" />
        </>
      )}
      {name === 'volume' && (
        <>
          <path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
        </>
      )}
      {name === 'muted' && (
        <>
          <path d="m11 4-6 5H2v6h3l6 5ZM16 9l6 6m0-6-6 6" />
        </>
      )}
      {name === 'expand' && <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />}
      {name === 'collapse' && <path d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5" />}
      {name === 'upload' && <path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5" />}
      {name === 'back' && (
        <>
          <path d="M4 8a9 9 0 1 1-1 7M4 3v5h5" />
          <text
            x="12"
            y="16"
            fill="currentColor"
            stroke="none"
            textAnchor="middle"
            fontSize="9"
            fontFamily="system-ui"
            fontWeight="600"
          >
            10
          </text>
        </>
      )}
    </svg>
  )
}
