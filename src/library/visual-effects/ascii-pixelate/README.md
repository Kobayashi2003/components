# ASCII Pixelate

Convert an image, canvas, or video into colored ASCII. Moving the pointer over the result reveals a denser character layer.

```tsx
import { AsciiPixelate } from './src/library/visual-effects/ascii-pixelate'

export function Example() {
  return <AsciiPixelate src="/portrait.png" resolution={160} colorMode="source" />
}
```

## Source and layout

`src` accepts an image URL, `HTMLImageElement`, `HTMLCanvasElement`, or `HTMLVideoElement`. The component renders pixels; the caller owns image upload, camera permission, and media cleanup. The demo keeps those tasks outside the component.

| Prop                 | Default             | Description                                                                    |
| -------------------- | ------------------- | ------------------------------------------------------------------------------ |
| `src`                | required            | Image URL or browser media element.                                            |
| `alt`                | `"ASCII rendering"` | Accessible name of the image.                                                  |
| `aspectRatio`        | `"auto"`            | Use the source ratio, or provide a width-to-height number.                     |
| `fit`                | `"cover"`           | `"cover"` crops to fill an explicit ratio; `"contain"` shows the whole source. |
| `background`         | `#101416`           | Background color.                                                              |
| `className`, `style` | —                   | Root element styling.                                                          |
| `onError`            | —                   | Called when loading or rendering fails.                                        |

## Characters and pointer detail

| Prop              | Default       | Description                                                                                                                                      |
| ----------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `resolution`      | `72`          | Base columns, clamped to 8–1024.                                                                                                                 |
| `charset`         | `"@#*+=-:. "` | Dense to sparse glyphs. Spaces are skipped for opaque pixels.                                                                                    |
| `densityMode`     | `"auto"`      | `"bright"` makes bright pixels dense; `"dark"` makes dark pixels dense. Auto uses ink and background in mono mode, or background in color modes. |
| `fontSize`        | `14`          | Maximum glyph size in CSS pixels. Glyphs shrink as columns increase.                                                                             |
| `contrast`        | `1.15`        | Source luminance contrast before choosing glyphs.                                                                                                |
| `focusMultiplier` | `1.9`         | Pointer detail density relative to the base, capped at 1536 columns.                                                                             |
| `focusRadius`     | `180`         | Detail radius in CSS pixels.                                                                                                                     |
| `blur`            | `0.3`         | Base layer blur, in CSS pixels, away from the pointer.                                                                                           |
| `disabled`        | `false`       | Disable pointer focus.                                                                                                                           |

The 1024-column setting retains that many characters in copied text. A narrow screen cannot show each glyph separately at that density; use fewer columns for a legible preview. Canvas and video rendering are frame rate limited at high column counts. `fps` defaults to 24 and sets an upper limit of 60.

## Color

| Prop               | Default          | Description                                                                      |
| ------------------ | ---------------- | -------------------------------------------------------------------------------- |
| `colorMode`        | `"mono"`         | `"mono"`, `"source"`, or `"palette"`.                                            |
| `color`            | `#d8f77b`        | Character color in mono mode.                                                    |
| `palette`          | Four warm colors | Hex color stops for palette mode, dark to light.                                 |
| `sourceSaturation` | `1.25`           | Saturation multiplier in source mode.                                            |
| `sourceBrightness` | `1.15`           | Brightness multiplier in source mode.                                            |
| `sourceShadowLift` | `0.3`            | Raise dark source colors while preserving hue; 0–0.8.                            |
| `sourceFill`       | `0.25`           | Faint sampled color behind glyphs in source mode; 0–1. Set to 0 for pure glyphs. |

On a dark background, automatic density maps bright source pixels to dense characters; on a light background, it maps dark pixels to dense characters. Shadow lift and color fill can retain more detail when glyphs become very small. `sourceFill` affects the Canvas image only, not the copied text.

## Export

The imperative handle returns the current base frame as plain text or a detached Canvas snapshot, including background and visible pointer detail. Clipboard writing and file download remain the caller's responsibility.

```tsx
import { useRef } from 'react'
import { AsciiPixelate } from './src/library/visual-effects/ascii-pixelate'
import type { AsciiPixelateHandle } from './src/library/visual-effects/ascii-pixelate'

function Example() {
  const asciiRef = useRef<AsciiPixelateHandle>(null)
  const copy = () => navigator.clipboard.writeText(asciiRef.current?.getText() ?? '')
  const download = () => {
    const canvas = asciiRef.current?.getCanvas()
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'ascii-pixelate.png'
    link.click()
  }

  return (
    <>
      <AsciiPixelate ref={asciiRef} src="/portrait.png" />
      <button onClick={() => void copy()}>Copy text</button>
      <button onClick={download}>Download PNG</button>
    </>
  )
}
```

Pixel sampling requires cross-origin images to permit CORS. Video streams should be stopped by the caller when no longer needed.
