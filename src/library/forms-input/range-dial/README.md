# Range Dial

A percentage input recreating the open tick ring of [Bencho's Wheel](https://bencho.dev/?c=humidity&theme=dark).

## Usage

```tsx
import { RangeDial } from './range-dial'

export function Example() {
  return <RangeDial label="Humidity" defaultValue={62} onChange={console.log} />
}
```

## Props

| Prop                         | Default               | Description                                         |
| ---------------------------- | --------------------- | --------------------------------------------------- |
| `value` / `onChange`         | —                     | Controlled integer percentage and change callback.  |
| `defaultValue`               | `62`                  | Initial uncontrolled value, from 0 to 100.          |
| `density` / `sweep` / `wave` | `60` / `300` / `2.6`  | Tick count, arc degrees, and drag wave strength.    |
| `color` / `trackColor`       | Automatic / `#505254` | Value accent and track color.                       |
| `label`                      | `Humidity`            | Accessible input name.                              |
| `disabled`                   | `false`               | Prevents input.                                     |
| `className` / `style`        | —                     | Root styling; width follows the parent up to 420px. |

## Notes

Click or drag around the ring; a spring wave follows the value and settles on release. Arrow keys change by 1, Page Up/Down by 10, Home/End reach the limits. Touch dragging suppresses scrolling on the control. Reduced motion removes the wave and transitions.
