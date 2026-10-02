# ASCII Glitch

A terminal-style text glitch with character replacement, horizontal tears, scanlines, and opacity flicker.

## Usage

```tsx
import { useRef } from 'react'
import { AsciiGlitch } from './ascii-glitch'
import type { AsciiGlitchHandle } from './ascii-glitch'

function Example() {
  const glitch = useRef<AsciiGlitchHandle>(null)
  return (
    <>
      <AsciiGlitch ref={glitch} text="SYSTEM ONLINE" />
      <button onClick={() => glitch.current?.trigger()}>Glitch</button>
    </>
  )
}
```

## Props

| Prop                 | Default               | Description                                                 |
| -------------------- | --------------------- | ----------------------------------------------------------- |
| `text`               | Required              | Source text; whitespace is preserved during a burst.        |
| `duration`           | `600` ms              | Burst duration, with a minimum of 120 ms.                   |
| `intensity`          | `0.7`                 | Character replacement and flicker strength, clamped to 0–1. |
| `glyphs`             | built-in terminal set | Characters used to replace non-whitespace text.             |
| `shift`              | `18` px               | Maximum displacement of two horizontal text bands.          |
| `scanlines`          | `true`                | Adds a subtle scanline texture.                             |
| `flicker`            | `true`                | Varies text opacity during a burst.                         |
| `triggerOnHover`     | `true`                | Starts a burst when the pointer enters.                     |
| `loopInterval`       | unset                 | Repeats bursts, no faster than `duration + 100` ms.         |
| `className`, `style` | —                     | Customize the root, including font and text color.          |

## Notes

- The ref exposes `trigger()` to start or restart a burst. After the burst, the original text returns.
- Assistive technology receives unchanged text. Reduced-motion preference prevents the burst animation.
