# Liquid Toggle

A draggable switch with a stretching thumb, spring return and inverted on-state colors. Inspired by [Bencho](https://bencho.dev/blocks/liq-toggle).

```tsx
import { LiquidToggle } from './liquid-toggle'

;<LiquidToggle label="Enable reminders" onChange={console.log} />
```

- `checked` / `onChange` support controlled state; `defaultChecked`: `false`; `label` is required.
- `stretch`: `0.36` (0–1); `disabled`: `false`.
- Click, Enter or Space toggles. Drag and release chooses the nearest end; pointer cancellation restores the previous value.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
