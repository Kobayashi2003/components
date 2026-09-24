# Radial Action Menu

A plus button unfurls a staggered semicircle of tool actions and folds back after selection. Inspired by [Bencho](https://bencho.dev/blocks/radial).

```tsx
import { RadialActionMenu } from './radial-action-menu'

;<RadialActionMenu
  items={[{ id: 'text', label: 'Text', icon: <span>T</span> }]}
  onSelect={console.log}
/>
```

- `items`: `{ id, label, icon, disabled? }[]`; renders up to seven tools. `onSelect` receives the ID.
- `radius`: `78` px (64–110); `stagger`: `28` ms (0–80); `label`: `Add`; `disabled`: `false`.
- Arrow keys move through tools; Escape, selection, outside click or focus leaving closes. Reserve 290 × 215px for the fan.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
