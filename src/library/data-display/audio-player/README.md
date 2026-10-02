# Audio Player

A compact now-playing card that expands into a larger playback view, based on [Bencho's Now playing interaction](https://bencho.dev/).

## Usage

```tsx
import { AudioPlayer } from './audio-player'

export function Example() {
  return (
    <AudioPlayer
      title="Cabra Field"
      subtitle="Side B"
      artwork="/art/cover.jpg"
      src="/audio/track.mp3"
    />
  )
}
```

## Props

| Prop                          | Default                        | Description                                                                                      |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `title`                       | Required                       | Track title.                                                                                     |
| `subtitle`                    | Required                       | Supporting track text.                                                                           |
| `artwork`                     | —                              | Cover image URL; missing or broken images use a placeholder.                                     |
| `src`                         | —                              | Audio URL; omitted for the simulated preview.                                                    |
| `duration`                    | `214`                          | Total time in seconds.                                                                           |
| `initialTime`                 | `0` with `src`, otherwise `52` | Initial progress in seconds.                                                                     |
| `initialExpanded`             | `false`                        | Opens the large player initially.                                                                |
| `autoPlay`                    | `false`                        | Requests native automatic playback.                                                              |
| `volume` / `muted`            | `1` / `false`                  | Volume from 0 to 1 and mute state; prop changes are applied to the audio element.                |
| `onVolumeChange`              | —                              | Receives actual volume and mute state.                                                           |
| `onPrevious` / `onNext`       | —                              | Track navigation callbacks. Previous falls back to restart; next is disabled without a callback. |
| `onEnded` / `onPlayingChange` | —                              | Native completion and playback state callbacks.                                                  |
| `onExpandedChange`            | —                              | Receives expanded state.                                                                         |
| `ref`                         | —                              | Exposes `play()`, `pause()`, and `seek(seconds)`. Handle rejected `play()` promises.             |
| `className`                   | `''`                           | Additional class on the player container.                                                        |
| `style`                       | —                              | Inline styles on the player container.                                                           |

## Notes

- Press the card to expand or collapse; drag or use the keyboard to seek. `liked` and `onLikedChange` control the like state.
- With `src`, the native audio element determines playback and duration. Without `src`, the player uses a simulated clock. Changing `src` resets playback.
- `expandedContent` accepts caller-owned queue or settings UI. `playbackRate`, `playbackGroup`, and `mediaSession` support external playback preferences; `onTimeChange` and `onError` report progress and failures.
- Local-file selection and playlists belong to the demo. The reusable player accepts a URL; browser policy may block automatic playback.
