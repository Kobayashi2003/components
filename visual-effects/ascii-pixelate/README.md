# ASCII Pixelate

An image, canvas, or video rendered as colored ASCII, with denser detail around the pointer.

## Usage

```tsx
import { AsciiPixelate } from './ascii-pixelate';

export function Example() {
  return <AsciiPixelate src="/portrait.png" resolution={160} colorMode="source" />;
}
```

## Props

| Prop                 | Default           | Description                                                                |
| -------------------- | ----------------- | -------------------------------------------------------------------------- |
| `src`                | Required          | Image URL, `HTMLImageElement`, `HTMLCanvasElement`, or `HTMLVideoElement`. |
| `alt`                | `ASCII rendering` | Accessible image label.                                                    |
| `resolution`         | `72`              | Base column count, clamped to 8–1024.                                      |
| `fontSize`           | `14` px           | Maximum character size.                                                    |
| `charset`            | `@#*+=-:. `       | Characters ordered from dense to sparse.                                   |
| `contrast`           | `1.15`            | Luminance contrast used to choose characters.                              |
| `densityMode`        | `auto`            | Automatic light/dark density direction; override with `bright` or `dark`.  |
| `focusMultiplier`    | `1.9`             | Pointer detail density, capped at 1536 columns.                            |
| `focusRadius`        | `180` px          | Radius of the detailed area.                                               |
| `blur`               | `0.3` px          | Blur away from the pointer.                                                |
| `disabled`           | `false`           | Disables pointer focus.                                                    |
| `colorMode`          | `mono`            | `mono`, `source`, or `palette` coloring.                                   |
| `color`              | `#d8f77b`         | Character color in mono mode.                                              |
| `palette`            | four warm colors  | Hex stops from dark to light in palette mode.                              |
| `sourceSaturation`   | `1.25`            | Source color saturation multiplier.                                        |
| `sourceBrightness`   | `1.15`            | Source color brightness multiplier.                                        |
| `sourceShadowLift`   | `0.3`             | Raises dark source colors while keeping their hue.                         |
| `sourceFill`         | `0.25`            | Sampled color behind glyphs; set to 0 for glyphs alone.                    |
| `aspectRatio`        | `auto`            | Source ratio or an explicit width-to-height number.                        |
| `fit`                | `cover`           | Crop to fill or `contain` the source within an explicit ratio.             |
| `background`         | `#101416`         | Surface color and automatic density reference.                             |
| `fps`                | `24`              | Live sampling rate, capped at 60 and throttled at high resolutions.        |
| `className`, `style` | —                 | Root element styling.                                                      |
| `onError`            | —                 | Loading or rendering error callback.                                       |

## Notes

- Use a ref of type `AsciiPixelateHandle`: `getText()` returns the current base frame, and `getCanvas()` returns a detached Canvas snapshot with background and visible pointer detail. Clipboard access and file download belong to the caller.
- Uploads and camera streams are handled by the demo, outside the reusable component. Callers should stop their own media tracks. Cross-origin images need CORS permission for pixel sampling.
- Lower `resolution` when individual characters need to remain legible; live high-resolution sources are frame rate limited.
