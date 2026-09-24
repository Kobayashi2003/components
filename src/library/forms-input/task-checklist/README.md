# Task Checklist

A task list for checking off work and adding tasks inline, with animated state changes. Inspired by [Bencho](https://bencho.dev/blocks/checklist).

```tsx
import { TaskChecklist } from './task-checklist'

;<TaskChecklist defaultItems={[{ id: 'draft', label: 'Review draft' }]} />
```

- `items` / `onChange` control the list; `defaultItems` defaults to `[]`. Items have `id`, `label` and optional `checked`.
- `allowAdd`: `true`; `label`: `Checklist`; `disabled`: `false`.
- Enter or blur saves a new task; Escape cancels. Space toggles a focused checkbox.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
