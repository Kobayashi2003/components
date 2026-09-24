# Morphing Audio Player

A compact now-playing card that expands into a larger playback view, based on [Bencho's Now playing interaction](https://bencho.dev/).

## Usage

```tsx
import { MorphingAudioPlayer } from './morphing-audio-player'

export function Example() {
  return (
    <MorphingAudioPlayer
      title="Cabra Field"
      subtitle="Side B"
      artwork="/art/cover.jpg"
      duration={214}
      initialTime={52}
    />
  )
}
```

## Props

| Prop              | Default  | Purpose                                   |
| ----------------- | -------- | ----------------------------------------- |
| `title`           | required | Track title.                              |
| `subtitle`        | required | Supporting track text.                    |
| `artwork`         | required | Cover image URL.                          |
| `duration`        | `214`    | Total time in seconds.                    |
| `initialTime`     | `52`     | Initial progress in seconds.              |
| `initialExpanded` | `false`  | Opens the large player initially.         |
| `className`       | `''`     | Additional class on the player container. |
| `style`           | —        | Inline styles on the player container.    |

## Notes

- Press the card to expand or collapse it. Drag or use the keyboard on the progress bar to seek. The play, restart, next, and like buttons work in the layouts where shown.
- Like state and the simulated playback clock are preserved while the layout changes. This visual interaction does not load or play an audio file.
- The demo cover is stored beside the component in `demo/cover.jpg` and comes from [Bencho](https://bencho.dev/lab/cover.jpg).
