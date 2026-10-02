# Task Checklist

A task list for checking off work and adding tasks inline, with animated state changes. Inspired by [Bencho](https://bencho.dev/blocks/checklist).

## Usage

```tsx
import { TaskChecklist } from './task-checklist'

export function Example() {
  return <TaskChecklist defaultItems={[{ id: 'draft', label: 'Review draft' }]} />
}
```

## Props

| Prop                 | Default     | Description                                               |
| -------------------- | ----------- | --------------------------------------------------------- |
| `items` / `onChange` | —           | Controlled task list and change callback.                 |
| `defaultItems`       | `[]`        | Initial tasks with `id`, `label`, and optional `checked`. |
| `allowAdd`           | `true`      | Allows inline task creation.                              |
| `label`              | `Checklist` | Accessible list name.                                     |
| `disabled`           | `false`     | Prevents editing.                                         |

## Notes

- Enter or blur saves a new task; Escape cancels. Space toggles a focused checkbox.
- Supports `className` and `style`; reduced motion disables decorative animation.
