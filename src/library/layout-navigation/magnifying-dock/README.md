# Magnifying Dock

A proximity-responsive dock that lifts and magnifies nearby icons, with labels and an active dot. Inspired by [Bencho](https://bencho.dev/blocks/dock).

```tsx
import { MagnifyingDock } from './magnifying-dock'

;<MagnifyingDock
  items={[{ id: 'home', label: 'Home', icon: <span>⌂</span> }]}
  onChange={console.log}
/>
```

- `items`: `{ id, label, icon, disabled? }[]`; `value` / `onChange` control selection; `defaultValue`: first item.
- `magnification`: `1.32` (1–2); `lift`: `8` px (0–24); `reach`: `2` neighboring items (0.5–4).
- `label`: `Dock`; `disabled`: `false`. Hover or focus magnifies, click selects; touch can scrub and release. Arrow keys move focus, Enter / Space select.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
