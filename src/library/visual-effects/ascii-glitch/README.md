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

- `text` is required. Whitespace is preserved and never replaced during a burst.
- `duration` defaults to 600 ms, with a minimum of 120 ms. `intensity` defaults to 0.7 and accepts 0–1.
- `glyphs` defaults to `$#@/\\|=+*%▒░` and supplies replacement characters. `shift` (18 px) limits the displacement of two horizontal text bands.
- `scanlines` and `flicker` default to true. `triggerOnHover` also defaults to true; `loopInterval` can repeat the effect at intervals no shorter than `duration + 100` ms.
- `className` and `style` customize the root, including text color and font.

## Notes

- The ref exposes `trigger()` to start or restart a burst. After the burst, the original text returns.
- Assistive technology receives unchanged text. Reduced-motion preference prevents the burst animation.
