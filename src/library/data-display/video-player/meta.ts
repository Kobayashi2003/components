import type { CatalogEntryMeta } from '../../../catalog/types'

export default {
  slug: 'video-player',
  title: 'Video Player',
  category: 'data-display',
  kind: 'component',
  status: 'experimental',
  summary:
    'A reusable video player with native playback, buffered progress, speed, and fullscreen controls.',
  usage: 'reusable',
  tags: ['responsive-layout', 'status-feedback', 'semantic-states'],
} satisfies CatalogEntryMeta
