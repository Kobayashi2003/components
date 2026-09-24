# Assignee Picker

A multi-select people picker with animated avatar stacking and a collapsible rounded list. Inspired by [Bencho](https://bencho.dev/blocks/picker).

```tsx
import { AssigneePicker } from './assignee-picker'

;<AssigneePicker people={[{ id: 'ada', name: 'Ada', detail: 'Design' }]} defaultValue={['ada']} />
```

- `people`: `{ id, name, detail?, avatar?, color?, disabled? }[]`. `avatar` is an image URL; `color` accepts a CSS background.
- `value` / `onChange`: selected IDs; `defaultValue`: `[]`; `defaultOpen`: `true`.
- `label`: `Assignees`; `disabled`: `false`. Native checkboxes support Tab and Space; Escape closes and restores trigger focus.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
