# Inline Confirm

A destructive-action pill unfolds into Keep / Delete, then displays a timed Undo state. Inspired by [Bencho](https://bencho.dev/blocks/confirm).

## Usage

```tsx
import { InlineConfirm } from './inline-confirm';

export function Example() {
  return (
    <InlineConfirm onConfirm={() => console.log('Delete')} onUndo={() => console.log('Restore')} />
  );
}
```

## Props

| Prop                                   | Default                              | Description                                        |
| -------------------------------------- | ------------------------------------ | -------------------------------------------------- |
| `onConfirm`                            | —                                    | Runs the destructive action; may return a Promise. |
| `onUndo`                               | —                                    | Optional restore action; enables Undo.             |
| `label` / `confirmLabel` / `doneLabel` | `Delete file` / `Delete` / `Deleted` | Text for each state.                               |
| `undoDuration`                         | `4000` ms                            | `0` keeps the result visible.                      |
| `disabled`                             | `false`                              | Prevents activation.                               |

## Notes

- Undo is shown only when `onUndo` is supplied. The caller implements deletion and restoration. Escape cancels the asking state; hovering or keyboard focus pauses the Undo countdown.
- Supports `className` and `style`; reduced motion disables decorative animation.
