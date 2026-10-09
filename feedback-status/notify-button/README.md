# Notify Button

A notification pill rings its bell and resizes smoothly as its confirmation label changes. Inspired by [Bencho](https://bencho.dev/blocks/toasts).

## Usage

```tsx
import { NotifyButton } from './notify-button';

export function Example() {
  return <NotifyButton onChange={console.log} />;
}
```

## Props

| Prop                    | Default                            | Description                                        |
| ----------------------- | ---------------------------------- | -------------------------------------------------- |
| `value` / `onChange`    | —                                  | Controlled notification state and change callback. |
| `defaultValue`          | `false`                            | Initial uncontrolled state.                        |
| `label` / `activeLabel` | `Notify me` / `You’ll be notified` | Inactive and active text.                          |
| `disabled`              | `false`                            | Prevents activation.                               |

## Notes

- The component changes presentation only; subscription or browser-notification logic belongs in the callback.
- Supports `className` and `style`; reduced motion disables decorative animation.
