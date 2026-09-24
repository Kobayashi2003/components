# Message Composer

A message field that separates its send button when focused or filled. Inspired by [Bencho](https://bencho.dev/blocks/command).

```tsx
import { MessageComposer } from './message-composer'

;<MessageComposer onSubmit={console.log} />
```

- `value` / `onChange` control text; `defaultValue`: empty. `onSubmit` receives trimmed text and clears the field.
- `onDictate` is an optional action callback; without it the dictate button is disabled. No microphone or network access is created.
- `placeholder`: `Ask anything…`; `label`: `Message`; `disabled`: `false`. Enter submits nonempty text; focus or text separates the send button.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
