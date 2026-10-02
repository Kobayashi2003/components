# Icon Navigation Bar

A rounded icon navigation bar with a springy selection capsule and horizontal or vertical layouts. Inspired by [Bencho](https://bencho.dev/blocks/icon-bar).

## Usage

```tsx
import { IconNavigationBar } from './icon-navigation-bar'

export function Example() {
  return (
    <IconNavigationBar
      items={[{ id: 'home', label: 'Home', icon: <span>⌂</span> }]}
      onChange={console.log}
    />
  )
}
```

## Props

| Prop                 | Default      | Description                                                |
| -------------------- | ------------ | ---------------------------------------------------------- |
| `items`              | Required     | Items with `id`, `label`, `icon`, and optional `disabled`. |
| `value` / `onChange` | —            | Controlled selected ID and change callback.                |
| `defaultValue`       | First item   | Initial selected ID.                                       |
| `label`              | `Main`       | Accessible navigation name.                                |
| `orientation`        | `horizontal` | `horizontal` or `vertical`.                                |
| `disabled`           | `false`      | Prevents selection.                                        |

## Notes

- Arrow keys / Home / End move focus; Enter or Space selects. Selection is reported with `aria-current`; route changes belong to the caller.
- Supports `className` and `style`; reduced motion disables decorative animation.
