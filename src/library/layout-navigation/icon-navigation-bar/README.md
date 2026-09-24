# Icon Navigation Bar

A rounded icon navigation bar with a springy selection capsule and horizontal or vertical layouts. Inspired by [Bencho](https://bencho.dev/blocks/icon-bar).

```tsx
import { IconNavigationBar } from './icon-navigation-bar'

;<IconNavigationBar
  items={[{ id: 'home', label: 'Home', icon: <span>⌂</span> }]}
  onChange={console.log}
/>
```

- `items`: `{ id, label, icon, disabled? }[]`; `value` / `onChange` control the selected ID.
- `defaultValue`: first item; `label`: `Main`; `orientation`: `horizontal` or `vertical`; `disabled`: `false`.
- Arrow keys / Home / End move focus; Enter or Space selects. Selection is reported with `aria-current`; route changes belong to the caller.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
