# Radial Action Menu

A plus button unfurls a staggered semicircle of tool actions and folds back after selection. Inspired by [Bencho](https://bencho.dev/blocks/radial).

## Usage

```tsx
import { RadialActionMenu } from './radial-action-menu';

export function Example() {
  return (
    <RadialActionMenu
      items={[{ id: 'text', label: 'Text', icon: <span>T</span> }]}
      onSelect={console.log}
    />
  );
}
```

## Props

| Prop                 | Default           | Description                                                              |
| -------------------- | ----------------- | ------------------------------------------------------------------------ |
| `items`              | Required          | Up to seven actions with `id`, `label`, `icon`, and optional `disabled`. |
| `onSelect`           | —                 | Receives the selected item ID.                                           |
| `radius` / `stagger` | `78` px / `28` ms | Fan radius and animation delay.                                          |
| `label`              | `Add`             | Trigger label.                                                           |
| `disabled`           | `false`           | Prevents opening.                                                        |

## Notes

- Arrow keys move through tools; Escape, selection, outside click or focus leaving closes. Reserve 290 × 215px for the fan.
- Supports `className` and `style`; reduced motion disables decorative animation.
