# Create Menu

A compact Create pill that expands into a rounded action menu with staggered items. Inspired by [Bencho](https://bencho.dev/blocks/liq-create).

```tsx
import { CreateMenu } from './create-menu'

;<CreateMenu items={[{ id: 'document', label: 'Document' }]} onSelect={console.log} />
```

- `items`: `{ id, label, icon?, disabled? }[]`; `onSelect` receives the item ID.
- `label`: `Create`; `disabled`: `false`.
- Arrow keys / Home / End move focus. Enter selects, Escape cancels; outside click or focus leaving closes the menu.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
