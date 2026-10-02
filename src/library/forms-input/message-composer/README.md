# Message Composer

A message field that separates its send button when focused or filled. Inspired by [Bencho](https://bencho.dev/blocks/command).

## Usage

```tsx
import { MessageComposer } from './message-composer'

export function Example() {
  return <MessageComposer onSubmit={console.log} />
}
```

## Props

| Prop                    | Default                     | Description                                                  |
| ----------------------- | --------------------------- | ------------------------------------------------------------ |
| `value` / `onChange`    | —                           | Controlled text and change callback.                         |
| `defaultValue`          | `""`                        | Initial uncontrolled text.                                   |
| `onSubmit`              | —                           | Receives trimmed text and clears the field.                  |
| `onDictate`             | —                           | Optional dictate action; no microphone behavior is built in. |
| `placeholder` / `label` | `Ask anything…` / `Message` | Field hint and accessible name.                              |
| `disabled`              | `false`                     | Prevents input.                                              |

## Notes

- Supports `className` and `style`; reduced motion disables decorative animation.
