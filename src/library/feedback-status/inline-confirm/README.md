# Inline Confirm

A destructive-action pill unfolds into Keep / Delete, then displays a timed Undo state. Inspired by [Bencho](https://bencho.dev/blocks/confirm).

```tsx
import { InlineConfirm } from './inline-confirm'

;<InlineConfirm onConfirm={() => console.log('Delete')} onUndo={() => console.log('Restore')} />
```

- `onConfirm` / `onUndo` may return a Promise; pending actions prevent duplicate activation and rejected actions show an error.
- `label`: `Delete file`; `confirmLabel`: `Delete`; `doneLabel`: `Deleted`; `undoDuration`: `4000` ms (`0` holds the result).
- Undo is shown only when `onUndo` is supplied. The caller implements deletion and restoration. `disabled`: `false`; Escape cancels the asking state.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
