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
| `artwork`                     | —                              | Cover image URL; also tints the card. Missing or broken images use a placeholder.                |
| `src`                         | —                              | Audio URL; omitted for the simulated preview.                                                    |
| `duration`                    | `214`                          | Total time in seconds for the simulated preview.                                                 |
| `initialTime`                 | `0` with `src`, otherwise `52` | Initial progress in seconds.                                                                     |
| `initialExpanded`             | `false`                        | Opens the large player initially.                                                                |
| `autoPlay`                    | `false`                        | Requests native automatic playback.                                                              |
| `volume` / `muted`            | `1` / `false`                  | Volume from 0 to 1 and mute state; prop changes are applied to the audio element.                |
| `playbackRate`                | `1`                            | Playback speed; a changed prop replaces the speed chosen in the player.                          |
| `playbackRates`               | `[0.75, 1, 1.25, 1.5, 2]`      | Speeds cycled by the speed button; normal speed is always included.                              |
| `seekStep`                    | `15`                           | Seconds skipped by the expanded skip buttons; `0` hides them.                                    |
| `onVolumeChange`              | —                              | Receives actual volume and mute state.                                                           |
| `onPlaybackRateChange`        | —                              | Receives the speed chosen in the player.                                                         |
| `onPrevious` / `onNext`       | —                              | Track navigation callbacks. Previous falls back to restart; next is disabled without a callback. |
| `onEnded` / `onPlayingChange` | —                              | Completion and playback state callbacks, including in the simulated preview.                     |
| `onExpandedChange`            | —                              | Receives expanded state.                                                                         |
| `ref`                         | —                              | Exposes `play()`, `pause()`, and `seek(seconds)`. Handle rejected `play()` promises.             |
| `className`                   | `''`                           | Additional class on the player container.                                                        |
| `style`                       | —                              | Inline styles on the player container.                                                           |

## Notes

- Press the card to expand or collapse; drag or use the keyboard to seek. With a player control focused, K plays or pauses, ← / → seek 5 seconds, M mutes, and Home / End jump to the start or end. `liked` and `onLikedChange` control the like state.
- With `src`, the native audio element determines playback, buffering, and duration. Without `src`, the player uses a simulated clock. Changing `src` resets playback.
- `expandedContent` accepts caller-owned queue or settings UI; shortcuts are not handled inside it. `playbackGroup` pauses other players in the same group, `mediaSession` publishes metadata and hardware media keys, and `onTimeChange` and `onError` report progress and failures.
- Theme with `--audio-player-background`, `-foreground`, `-muted`, `-track`, `-progress`, `-control`, `-play-background`, `-play-color`, `-accent`, and `-ambient` (artwork glow opacity, `0` disables it).
- Local-file selection and playlists belong to the demo. The reusable player accepts a URL; browser policy may block automatic playback.
