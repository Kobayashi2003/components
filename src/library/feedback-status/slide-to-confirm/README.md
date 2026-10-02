# Slide to Confirm

A compact drag-to-confirm control with a filling track, elastic return and success state. Inspired by [Bencho](https://bencho.dev/blocks/slide-confirm).

## Usage

```tsx
import { SlideToConfirm } from './slide-to-confirm'

export function Example() {
  return <SlideToConfirm onConfirm={() => console.log('Confirmed')} />
}
```

## Props

| Prop                       | Default                          | Description                     |
| -------------------------- | -------------------------------- | ------------------------------- |
| `onConfirm`                | —                                | Runs after a completed gesture. |
| `label` / `confirmedLabel` | `Slide to confirm` / `Confirmed` | Prompt and success text.        |
| `resetAfter`               | `1800` ms                        | `0` keeps the success state.    |
| `disabled`                 | `false`                          | Prevents activation.            |

## Notes

- Keyboard users can confirm with Enter or Space. The callback owns the actual action.
- Supports `className` and `style`; reduced motion disables decorative animation.
