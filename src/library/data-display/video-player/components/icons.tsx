export type VideoIconName =
  | 'play'
  | 'pause'
  | 'replay'
  | 'volume'
  | 'volume-low'
  | 'muted'
  | 'expand'
  | 'collapse'
  | 'upload'
  | 'back'
  | 'forward'
  | 'pip'
  | 'settings'
  | 'captions'
  | 'chevron-left'
  | 'chevron-right'
  | 'check'
  | 'alert'
  | 'speed'

export function VideoIcon({
  name,
  size = 20,
  value,
}: {
  name: VideoIconName
  size?: number
  value?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'play' && (
        <path
          d="M7.5 5.2c0-.9 1-1.5 1.8-1l10.2 6.8a1.2 1.2 0 0 1 0 2L9.3 19.8c-.8.5-1.8-.1-1.8-1Z"
          fill="currentColor"
          stroke="none"
        />
      )}
      {name === 'pause' && (
        <g fill="currentColor" stroke="none">
          <rect x="6" y="4.5" width="4.2" height="15" rx="1.3" />
          <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.3" />
        </g>
      )}
      {name === 'replay' && <path d="M4.5 9.5a8 8 0 1 1-.3 5M4 4v5.5h5.5" />}
      {(name === 'volume' || name === 'volume-low' || name === 'muted') && (
        <path d="M11 4.5 6.2 8.6H3.5v6.8h2.7L11 19.5Z" fill="currentColor" strokeWidth="1.4" />
      )}
      {name === 'volume' && <path d="M15 9a4.2 4.2 0 0 1 0 6m2.8-8.8a8.2 8.2 0 0 1 0 11.6" />}
      {name === 'volume-low' && <path d="M15 9a4.2 4.2 0 0 1 0 6" />}
      {name === 'muted' && <path d="m15.5 9.5 5 5m0-5-5 5" />}
      {name === 'expand' && <path d="M8 3.5H3.5V8m12.5-4.5h4.5V8M3.5 16v4.5H8m12.5-4.5v4.5H16" />}
      {name === 'collapse' && <path d="M3.5 8H8V3.5m8 0V8h4.5M8 20.5V16H3.5m17 0H16v4.5" />}
      {name === 'upload' && <path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5" />}
      {(name === 'back' || name === 'forward') && (
        <>
          <g transform={name === 'forward' ? 'matrix(-1 0 0 1 24 0)' : undefined}>
            <path d="M5.2 8.4A8 8 0 1 1 4 12.8" />
            <path d="M4.6 3.8v4.8h4.8" />
          </g>
          {value !== undefined && (
            <text
              x={name === 'forward' ? 11.4 : 12.6}
              y="15.6"
              fill="currentColor"
              stroke="none"
              fontFamily="system-ui, sans-serif"
              fontSize="7.4"
              fontWeight="700"
              textAnchor="middle"
            >
              {value}
            </text>
          )}
        </>
      )}
      {name === 'pip' && (
        <>
          <path d="M20.5 11V6.5a2 2 0 0 0-2-2h-13a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10" />
          <rect x="13" y="13.5" width="8" height="6" rx="1.2" fill="currentColor" stroke="none" />
        </>
      )}
      {name === 'settings' && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </>
      )}
      {name === 'captions' && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M10.5 10.2a2.4 2.4 0 1 0 0 3.6m6-3.6a2.4 2.4 0 1 0 0 3.6" />
        </>
      )}
      {name === 'chevron-left' && <path d="m15 18-6-6 6-6" />}
      {name === 'chevron-right' && <path d="m9 18 6-6-6-6" />}
      {name === 'check' && <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth="2.2" />}
      {name === 'alert' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5m0 3.5h.01" strokeWidth="2.2" />
        </>
      )}
      {name === 'speed' && (
        <>
          <path d="M4.3 17.5a9 9 0 1 1 15.4 0" />
          <path d="m12 13.5 4-5" strokeWidth="2.2" />
        </>
      )}
    </svg>
  )
}
