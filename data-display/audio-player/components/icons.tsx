type IconName =
  | 'play'
  | 'pause'
  | 'previous'
  | 'next'
  | 'rewind'
  | 'forward'
  | 'heart'
  | 'volume'
  | 'muted'
  | 'chevron';

const stroked = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function PlayerIcon({
  name,
  size = 24,
  value,
}: {
  name: IconName;
  size?: number;
  value?: number;
}) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true as const };

  switch (name) {
    case 'volume':
    case 'muted':
      return (
        <svg {...common} {...stroked}>
          <path d="M11 4.5 6.2 8.6H3.5v6.8h2.7L11 19.5Z" />
          {name === 'volume' ? (
            <path d="M15 9a4.2 4.2 0 0 1 0 6m2.8-8.8a8.2 8.2 0 0 1 0 11.6" />
          ) : (
            <path d="m15.5 9.5 5 5m0-5-5 5" />
          )}
        </svg>
      );
    case 'play':
      return (
        <svg {...common} fill="currentColor">
          <path d="M7.5 5.2c0-.9 1-1.5 1.8-1l10.2 6.8a1.2 1.2 0 0 1 0 2L9.3 19.8c-.8.5-1.8-.1-1.8-1V5.2Z" />
        </svg>
      );
    case 'pause':
      return (
        <svg {...common} fill="currentColor">
          <rect x="6" y="4.5" width="4.2" height="15" rx="1.3" />
          <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.3" />
        </svg>
      );
    case 'previous':
    case 'next':
      return (
        <svg {...common} fill="currentColor">
          <g transform={name === 'next' ? 'matrix(-1 0 0 1 24 0)' : undefined}>
            <rect x="4" y="5" width="2.4" height="14" rx="1.2" />
            <path d="M19.5 6.3v11.4c0 .9-1 1.4-1.7.9l-8.6-5.7a1.1 1.1 0 0 1 0-1.8l8.6-5.7c.7-.5 1.7 0 1.7.9Z" />
          </g>
        </svg>
      );
    case 'rewind':
    case 'forward':
      return (
        <svg {...common} {...stroked} strokeWidth={1.6}>
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
        </svg>
      );
    case 'heart':
      return (
        <svg {...common} {...stroked} strokeWidth={1.8}>
          <path d="M20.8 5.7a5.1 5.1 0 0 0-7.2 0L12 7.3l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8.1a5.1 5.1 0 0 0 0-7.2Z" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...common} {...stroked} strokeWidth={2}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
  }
}
