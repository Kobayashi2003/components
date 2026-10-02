# Analog Video Distortion

A damaged-tape and CRT effect wrapper for arbitrary React content.

## Usage

```tsx
import { AnalogVideoEffect } from './analog-video-distortion'

export function Example() {
  return (
    <AnalogVideoEffect noise={0.15} tearing={0.7} smear={0.6}>
      <article>Your content</article>
    </AnalogVideoEffect>
  )
}
```

## Props

| Prop                          | Default                | Description                                    |
| ----------------------------- | ---------------------- | ---------------------------------------------- |
| `children`                    | Required               | Content receiving the effect.                  |
| `noise` / `tearing` / `smear` | `0.15` / `0.7` / `0.6` | Tape defects, each from 0 to 1.                |
| `scanlines` / `colorShift`    | `0.25` / `0.4`         | CRT scanlines and RGB shift, each from 0 to 1. |
| `className`                   | —                      | Wrapper class.                                 |

## Notes

- The effect uses DOM slices and Canvas 2D; canvas rendering pauses while hidden.
- Reduced-motion mode lowers the refresh rate and suppresses strong faults.
