# Assignee Picker

A multi-select people picker with animated avatar stacking and a collapsible rounded list. Inspired by [Bencho](https://bencho.dev/blocks/picker).

## Usage

```tsx
import { AssigneePicker } from './assignee-picker'

export function Example() {
  return (
    <AssigneePicker
      people={[{ id: 'ada', name: 'Ada', detail: 'Design' }]}
      defaultValue={['ada']}
    />
  )
}
```

## Props

| Prop                 | Default     | Description                                                                      |
| -------------------- | ----------- | -------------------------------------------------------------------------------- |
| `people`             | Required    | People with `id`, `name`, and optional detail, avatar, color, or disabled state. |
| `value` / `onChange` | —           | Controlled selected IDs and change callback.                                     |
| `defaultValue`       | `[]`        | Initial selected IDs.                                                            |
| `defaultOpen`        | `true`      | Initial list visibility.                                                         |
| `label`              | `Assignees` | Accessible picker name.                                                          |
| `disabled`           | `false`     | Prevents selection.                                                              |

## Notes

- `label`: `Assignees`; `disabled`: `false`. Native checkboxes support Tab and Space; Escape closes and restores trigger focus.
- Supports `className` and `style`; reduced motion disables decorative animation.
