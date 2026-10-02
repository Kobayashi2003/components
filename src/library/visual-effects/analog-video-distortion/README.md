# Analog Video Distortion

A damaged-tape and CRT effect wrapper for arbitrary React content.

## Usage

```tsx
import { AnalogVideoDistortion } from './analog-video-distortion'

export function Example() {
  return (
    <AnalogVideoDistortion noise={0.15} tearing={0.7} smear={0.6}>
      <article>Your content</article>
    </AnalogVideoDistortion>
  )
}
```

## Props

| Prop                          | Default                | Description                                    |
| ----------------------------- | ---------------------- | ---------------------------------------------- |
| `children`                    | Required               | Content receiving the effect.                  |
| `noise` / `tearing` / `smear` | `0.15` / `0.7` / `0.6` | Tape defects, each from 0 to 1.                |
| `scanlines` / `colorShift`    | `0.25` / `0.4`         | CRT scanlines and RGB shift, each from 0 to 1. |
| `disabled`                    | `false`                | Shows the content without the effect.          |
| `className` / `style`         | —                      | Wrapper class and inline styles.               |

## Notes

- The effect uses DOM slices and Canvas 2D; animation pauses while the page is hidden or the effect is off screen.
- Reduced-motion mode lowers the refresh rate and suppresses strong faults.
