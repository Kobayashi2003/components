# Expanding Search

A round search button that stretches into an editable field and springs closed when empty. Inspired by [Bencho](https://bencho.dev/blocks/seek).

## Usage

```tsx
import { ExpandingSearch } from './expanding-search'

export function Example() {
  return <ExpandingSearch onSearch={console.log} />
}
```

## Props

| Prop                    | Default  | Description                                 |
| ----------------------- | -------- | ------------------------------------------- |
| `value` / `onChange`    | —        | Controlled search text and change callback. |
| `defaultValue`          | `""`     | Initial uncontrolled text.                  |
| `onSearch`              | —        | Receives trimmed, nonempty text on Enter.   |
| `label` / `placeholder` | `Search` | Accessible name and field hint.             |
| `disabled`              | `false`  | Prevents input.                             |

## Notes

- Escape clears and collapses; an empty field collapses on blur. `disabled`: `false`.
- Supports `className` and `style`; reduced motion disables decorative animation.
