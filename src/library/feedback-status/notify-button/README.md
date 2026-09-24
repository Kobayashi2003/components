# Notify Button

A notification pill rings its bell and resizes smoothly as its confirmation label changes. Inspired by [Bencho](https://bencho.dev/blocks/toasts).

```tsx
import { NotifyButton } from './notify-button'

;<NotifyButton onChange={console.log} />
```

- `value` / `onChange` control the boolean state; `defaultValue`: `false`.
- `label`: `Notify me`; `activeLabel`: `You’ll be notified`; `disabled`: `false`.
- The component changes presentation only; subscription or browser-notification logic belongs in the callback.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
