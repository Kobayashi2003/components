import type { CatalogEntryMeta } from '../../../catalog/types'

export default {
  slug: 'audio-player',
  title: 'Audio Player',
  category: 'data-display',
  kind: 'component',
  status: 'experimental',
  summary: 'A compact now-playing card that expands into a larger playback view.',
  usage: 'reusable',
  capabilities: { touch: 'supported', keyboard: true, reducedMotion: true },
  tags: ['semantic-states', 'responsive-layout'],
} satisfies CatalogEntryMeta
