import type { CatalogEntryMeta } from '../../../catalog/types'

export default {
  slug: 'inline-confirm',
  title: 'Inline Confirm',
  category: 'feedback-status',
  kind: 'component',
  status: 'experimental',
  summary:
    'A destructive-action pill unfolds into Keep / Delete, then displays a timed Undo state.',
  usage: 'reusable',
  tags: ['status-feedback', 'semantic-states'],
} satisfies CatalogEntryMeta
