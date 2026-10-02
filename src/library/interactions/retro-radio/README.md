# Retro Radio

A vintage audio player with station tuning, volume control, local-file playback, and analyser-driven CRT feedback.

## Usage

```tsx
import { RetroRadio } from './retro-radio'

export function Example() {
  return (
    <RetroRadio
      stations={[
        { id: '01', name: 'Warm', frequency: '88.6', glyph: 'W', angle: -46 },
        { id: '02', name: 'Direct', frequency: '101.3', glyph: 'D', angle: 0 },
      ]}
      onStationChange={(station) => console.log(station)}
    />
  )
}
```

## Props

| Prop                                 | Default  | Description                                                             |
| ------------------------------------ | -------- | ----------------------------------------------------------------------- |
| `stations`                           | Required | Stations with `id`, `name`, `frequency`, `glyph`, and optional `angle`. |
| `initialIndex`                       | `0`      | Initially tuned station.                                                |
| `defaultVolume`                      | `62`     | Initial volume, from 0 to 100.                                          |
| `showBackground`                     | `true`   | Shows the cabinet backdrop.                                             |
| `onStationChange` / `onVolumeChange` | —        | Reports tuning and volume changes.                                      |
| `onPlaybackChange` / `onMusicChange` | —        | Reports playback and music changes.                                     |

## Notes

- Selected audio files stay in the browser and are not uploaded.
- Tuning, volume, and antenna controls support pointer input; the main controls also support keyboard input.
- `RetroRadioBackground` is available as a separate export.
