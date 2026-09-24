type IconName = 'play' | 'pause' | 'previous' | 'next' | 'heart'

export function PlayerIcon({ name, size = 24 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'play':
      return (
        <svg {...common} fill="currentColor">
          <path d="M7 4.7c0-.8.9-1.3 1.6-.9l11.1 7.3a1.1 1.1 0 0 1 0 1.8L8.6 20.2c-.7.4-1.6-.1-1.6-.9V4.7Z" />
        </svg>
      )
    case 'pause':
      return (
        <svg {...common} fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      )
    case 'previous':
    case 'next':
      return (
        <svg
          {...common}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {name === 'previous' ? (
            <>
              <path d="M5 4v16" />
              <path d="M18.5 5.5 7.5 12l11 6.5V5.5Z" />
            </>
          ) : (
            <>
              <path d="M19 4v16" />
              <path d="M5.5 5.5 16.5 12l-11 6.5V5.5Z" />
            </>
          )}
        </svg>
      )
    case 'heart':
      return (
        <svg
          {...common}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M20.8 5.7a5.1 5.1 0 0 0-7.2 0L12 7.3l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.1a5.1 5.1 0 0 0 0-7.2Z" />
        </svg>
      )
  }
}
