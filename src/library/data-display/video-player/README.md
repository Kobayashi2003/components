# Video Player

A React video player with native playback, seeking, buffered ranges, volume, playback speed, and fullscreen controls.

## Usage

```tsx
import { VideoPlayer } from './video-player'

export function Example() {
  return <VideoPlayer src="/videos/demo.mp4" title="Demo video" />
}
```

## Props

| Prop                             | Default                  | Description                                            |
| -------------------------------- | ------------------------ | ------------------------------------------------------ |
| `src`                            | Required                 | Video URL                                              |
| `poster`                         | —                        | Poster image URL                                       |
| `title`                          | `Video Player`           | Visible title and accessible region name               |
| `autoPlay` / `muted` / `loop`    | `false`                  | Automatic playback, muting, and looping                |
| `preload`                        | `metadata`               | Native preload strategy                                |
| `initialTime`                    | `0`                      | Initial playback position in seconds                   |
| `resumeTime`                     | `0`                      | Offers an optional resume action after metadata loads. |
| `subtitles`                      | `[]`                     | WebVTT tracks with `src`, `label`, and `language`.     |
| `defaultVolume`                  | `1`                      | Initial volume from 0 to 1                             |
| `playbackRates`                  | `[0.5, 1, 1.25, 1.5, 2]` | Speed options; normal speed is always included         |
| `className` / `style`            | —                        | Root element styling                                   |
| `ref`                            | —                        | Exposes `play()`, `pause()`, and `seek(seconds)`       |
| `onPlay` / `onPause` / `onEnded` | —                        | Native playback state callbacks                        |
| `onTimeChange`                   | —                        | Receives current time and duration in seconds          |
| `onError`                        | —                        | Receives loading or playback errors                    |

## Notes

- Supports browser video formats and WebVTT subtitles. HLS/DASH and live playback require separate integration; remote subtitles must satisfy browser origin rules.
- With the player focused, Space or K toggles playback, arrows adjust time or volume, M mutes, and F toggles fullscreen. `touchGestures` and `doubleClickFullscreen` default to `true`.
- `chapters` accepts `{ time, title }[]`; `thumbnails` accepts supplied `{ start, end, src }[]` images. `playbackGroup`, `mediaSession`, and rate/volume callbacks support external preferences.
- Changing `src` resets the session. Automatic playback, fullscreen, picture-in-picture, and volume behavior depend on browser support. Handle rejected `ref.play()` promises.
- The demo handles local files and saved positions. Set `--video-player-accent` to change the accent color.
