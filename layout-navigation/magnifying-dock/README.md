# Magnifying Dock

A proximity-responsive dock that lifts and magnifies nearby icons, with labels and an active dot. Inspired by [Bencho](https://bencho.dev/blocks/dock).

## Usage

```tsx
import { MagnifyingDock } from './magnifying-dock';

export function Example() {
  return (
    <MagnifyingDock
      items={[{ id: 'home', label: 'Home', icon: <span>⌂</span> }]}
      onChange={console.log}
    />
  );
}
```

## Props

| Prop                               | Default               | Description                                                |
| ---------------------------------- | --------------------- | ---------------------------------------------------------- |
| `items`                            | Required              | Items with `id`, `label`, `icon`, and optional `disabled`. |
| `value` / `onChange`               | —                     | Controlled selected ID and change callback.                |
| `defaultValue`                     | First item            | Initial selected ID.                                       |
| `magnification` / `lift` / `reach` | `1.32` / `8` px / `2` | Scale, lift, and number of nearby items affected.          |
| `label`                            | `Dock`                | Accessible dock name.                                      |
| `disabled`                         | `false`               | Prevents selection.                                        |

## Notes

- Hover or focus magnifies, click selects; touch can scrub and release. Arrow keys move focus, Enter / Space select.
- Supports `className` and `style`; reduced motion disables decorative animation.
