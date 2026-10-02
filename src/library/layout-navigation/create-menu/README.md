# Create Menu

A compact Create pill that expands into a rounded action menu with staggered items. Inspired by [Bencho](https://bencho.dev/blocks/liq-create).

## Usage

```tsx
import { CreateMenu } from './create-menu'

export function Example() {
  return <CreateMenu items={[{ id: 'document', label: 'Document' }]} onSelect={console.log} />
}
```

## Props

| Prop       | Default  | Description                                                           |
| ---------- | -------- | --------------------------------------------------------------------- |
| `items`    | Required | Actions with `id`, `label`, optional `icon`, and optional `disabled`. |
| `onSelect` | —        | Receives the selected item ID.                                        |
| `label`    | `Create` | Trigger label.                                                        |
| `disabled` | `false`  | Prevents opening.                                                     |

## Notes

- Arrow keys / Home / End move focus. Enter selects, Escape cancels; outside click or focus leaving closes the menu.
- Supports `className` and `style`; reduced motion disables decorative animation.
