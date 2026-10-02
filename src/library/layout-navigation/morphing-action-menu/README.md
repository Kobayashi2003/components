# Morphing Action Menu

A compact pill, labelled Create by default, that morphs into a rounded action menu with staggered items. Inspired by [Bencho](https://bencho.dev/blocks/liq-create).

## Usage

```tsx
import { MorphingActionMenu } from './morphing-action-menu'

export function Example() {
  return (
    <MorphingActionMenu items={[{ id: 'document', label: 'Document' }]} onSelect={console.log} />
  )
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
