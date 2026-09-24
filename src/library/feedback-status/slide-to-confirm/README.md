# Slide to Confirm

A compact drag-to-confirm control with a filling track, elastic return and success state. Inspired by [Bencho](https://bencho.dev/blocks/slide-confirm).

```tsx
import { SlideToConfirm } from './slide-to-confirm'

;<SlideToConfirm onConfirm={() => console.log('Confirmed')} />
```

- `onConfirm` runs once on a completed gesture. Releasing early or cancelling returns the handle.
- `label`: `Slide to confirm`; `confirmedLabel`: `Confirmed`; `resetAfter`: `1800` ms, `0` holds success.
- `disabled`: `false`. Keyboard users can confirm with Enter or Space. The callback owns the actual action.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
