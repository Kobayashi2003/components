# Vinyl Deck

An SVG audio deck with track selection, platter dragging, playback controls, local-file queues, shuffle, and automatic advance.

## Usage

```tsx
import { VinylDeck } from './vinyl-deck';

export function Example() {
  return (
    <VinylDeck
      items={[
        {
          id: '01',
          title: 'Blue Static',
          genre: 'Breakcore',
          release: '2026',
          author: 'Afterimage',
          caption: 'Noise becomes rhythm.',
          cover: '/cover.jpg',
          audio: '/track.mp3',
        },
      ]}
      backgroundControls
    />
  );
}
```

## Props

| Prop                                                           | Default          | Description                                                            |
| -------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `items`                                                        | Required         | Tracks with metadata and optional cover, audio, color, BPM, or format. |
| `source`                                                       | —                | Overrides active audio with a URL, Blob, File, or MediaStream.         |
| `initialIndex`                                                 | `0`              | Initially selected track.                                              |
| `autoPlay` / `loop` / `muted`                                  | `false`          | Initial playback behavior.                                             |
| `volume` / `defaultVolume`                                     | - / `64`         | Controlled or initial volume, from 0 to 100.                           |
| `shuffle` / `defaultShuffle`                                   | - / `false`      | Controlled or initial shuffle state.                                   |
| `autoAdvance` / `defaultAutoAdvance`                           | - / `false`      | Controlled or initial automatic advance.                               |
| `shadowAngle` / `defaultShadowAngle`                           | - / `90`         | Controlled or initial shadow angle in degrees.                         |
| `showBackground` / `backgroundControls`                        | `true` / `false` | Backdrop and backdrop controls.                                        |
| `audioRef`                                                     | —                | Underlying audio element ref.                                          |
| `onChange` / `onTimeUpdate` / `onAudioFilesChange` / `onError` | —                | Navigation, progress, local-file, and error callbacks.                 |

## Notes

- Remote audio requires CORS permission for spectrum analysis.
- The optional file control reads MP3 and FLAC metadata and replaces the temporary local queue.
- `VinylTurntable` and `VinylDeckBackground` are available as separate exports. `FocusDeck` is a compatibility alias.
