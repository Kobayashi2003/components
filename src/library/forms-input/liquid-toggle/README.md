# Liquid Toggle

A draggable switch with a stretching thumb, spring return and inverted on-state colors. Inspired by [Bencho](https://bencho.dev/blocks/liq-toggle).

## Usage

```tsx
import { LiquidToggle } from './liquid-toggle'

export function Example() {
  return <LiquidToggle label="Enable reminders" onChange={console.log} />
}
```

## Props

| Prop                   | Default  | Description                           |
| ---------------------- | -------- | ------------------------------------- |
| `label`                | Required | Accessible switch name.               |
| `checked` / `onChange` | —        | Controlled state and change callback. |
| `defaultChecked`       | `false`  | Initial uncontrolled state.           |
| `stretch`              | `0.36`   | Thumb stretch, from 0 to 1.           |
| `disabled`             | `false`  | Prevents input.                       |

## Notes

- Click, Enter or Space toggles. Drag and release chooses the nearest end; pointer cancellation restores the previous value.
- Supports `className` and `style`; reduced motion disables decorative animation.
