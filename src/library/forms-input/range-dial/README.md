# Range Dial

A percentage input recreating the open tick ring of [Bencho's Wheel](https://bencho.dev/?c=humidity&theme=dark).

```tsx
import { RangeDial } from './range-dial'

;<RangeDial label="Humidity" defaultValue={62} onChange={console.log} />
```

- `value` / `onChange`: controlled input; `defaultValue` defaults to `62`. Values round to integers from 0 to 100.
- `density`: `60` ticks (20–100); `sweep`: `300` degrees (180–330); `wave`: `2.6` drag-wave strength (0–5).
- `color`: optional fixed accent; otherwise red below 10%, orange below 30%, green below 70%, blue from 70%. `trackColor`: `#505254`.
- `label`: `Humidity`; `disabled`: `false`.
- `className` / `style`: root customization; width follows the parent up to 420px.

Click or drag around the ring; a spring wave follows the value and settles on release. Arrow keys change by 1, Page Up/Down by 10, Home/End reach the limits. Touch dragging suppresses scrolling on the control. Reduced motion removes the wave and transitions. Demo controls are separate from the public component.
