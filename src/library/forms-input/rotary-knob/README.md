# Rotary Knob

A rotary numeric input with adjustable drag resistance and detents, in graphite, ivory and orange finishes.

## Usage

```tsx
import { RotaryKnob } from './rotary-knob'

export function Example() {
  return (
    <RotaryKnob
      label="Gain"
      defaultValue={50}
      damping={0.35}
      detentStep={10}
      detentStrength={0.6}
    />
  )
}
```

## Props

| Prop                            | Default           | Description                                                  |
| ------------------------------- | ----------------- | ------------------------------------------------------------ |
| `label`                         | Required          | Accessible input name.                                       |
| `value` / `onChange`            | —                 | Controlled value and change callback.                        |
| `defaultValue`                  | `50`              | Initial uncontrolled value.                                  |
| `min` / `max` / `step`          | `0` / `100` / `1` | Bounds and step size.                                        |
| `unit`                          | `%`               | Displayed unit.                                              |
| `damping`                       | `0.35`            | Drag resistance, from 0 to 1.                                |
| `detentStep` / `detentStrength` | `10` / `0.6`      | Notch spacing and resistance; zero spacing disables notches. |
| `appearance`                    | `graphite`        | `graphite`, `ivory`, or `signal`.                            |
| `disabled`                      | `false`           | Prevents input.                                              |
| `className` / `style`           | —                 | Root styling.                                                |

## Notes

Drag around the rim; double-click resets to `defaultValue`. Arrow keys adjust a step, Page Up/Down ten steps, Home/End reach the bounds. Touch dragging suppresses scrolling only on the knob. Reduced motion removes settling animation. Detents simulate input resistance, not hardware vibration.
