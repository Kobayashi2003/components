# Video Player

A React video player with native playback, chapters, subtitles, touch gestures, keyboard shortcuts, speed, and fullscreen controls.

## Usage

```tsx
import { VideoPlayer } from './video-player';

export function Example() {
  return <VideoPlayer src="/videos/demo.mp4" title="Demo video" />;
}
```

## Props

| Prop                              | Default                        | Description                                                         |
| --------------------------------- | ------------------------------ | ------------------------------------------------------------------- |
| `src`                             | Required                       | Video URL                                                           |
| `poster`                          | —                              | Poster image URL                                                    |
| `title`                           | `Video Player`                 | Visible title and accessible region name                            |
| `autoPlay` / `muted` / `loop`     | `false`                        | Automatic playback, muting, and looping                             |
| `preload`                         | `metadata`                     | Native preload strategy                                             |
| `initialTime`                     | `0`                            | Initial playback position in seconds                                |
| `resumeTime`                      | `0`                            | Offers an optional resume action after metadata loads               |
| `seekStep`                        | `10`                           | Seconds for the skip buttons, J / L, and double-tap seeking         |
| `subtitles`                       | `[]`                           | WebVTT tracks with `src`, `label`, and `language`                   |
| `defaultSubtitle`                 | `off`                          | Initially selected subtitle `src` or `language`                     |
| `chapters`                        | `[]`                           | `{ time, title }[]`; splits the timeline and adds a chapter menu    |
| `thumbnails`                      | `[]`                           | Supplied `{ start, end, src }[]` hover previews                     |
| `defaultVolume`                   | `1`                            | Volume from 0 to 1                                                  |
| `playbackRate`                    | `1`                            | Playback speed applied to the video                                 |
| `playbackRates`                   | `[0.5, 0.75, 1, 1.25, 1.5, 2]` | Speed options; normal speed is always included                      |
| `touchGestures`                   | `true`                         | Tap toggles controls; double-tap the sides to seek, centre to pause |
| `doubleClickFullscreen`           | `true`                         | Double-clicking the video toggles fullscreen                        |
| `className` / `style`             | —                              | Root element styling                                                |
| `ref`                             | —                              | Exposes `play()`, `pause()`, and `seek(seconds)`                    |
| `onPlay` / `onPause` / `onEnded`  | —                              | Native playback state callbacks                                     |
| `onTimeChange`                    | —                              | Receives current time and duration in seconds                       |
| `onVolumeChange` / `onRateChange` | —                              | Report volume, mute, and speed changes for saved preferences        |
| `onSubtitleChange`                | —                              | Receives the selected subtitle language or `null`                   |
| `onError`                         | —                              | Receives loading or playback errors                                 |

## Notes

- Supports browser video formats and WebVTT subtitles. HLS/DASH and live playback require separate integration; remote subtitles must satisfy browser origin rules.
- With the player focused: Space or K plays, ← / → seek 5 seconds, J / L seek `seekStep`, ↑ / ↓ change volume, M mutes, C toggles subtitles, F toggles fullscreen, I toggles picture-in-picture, < / > change speed, , / . step frames while paused, and 0–9 jump to 0–90%. The settings menu lists these shortcuts.
- `playbackGroup` pauses other players in the same group, and `mediaSession` publishes metadata and hardware media keys.
- Changing `src` resets the session. Automatic playback, fullscreen, picture-in-picture, and volume behavior depend on browser support; iOS falls back to native video fullscreen. Handle rejected `ref.play()` promises.
- The demo handles local files, sample chapters and subtitles, and saved positions. Set `--video-player-accent` to change the accent color.
