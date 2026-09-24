# Expanding Search

A round search button that stretches into an editable field and springs closed when empty. Inspired by [Bencho](https://bencho.dev/blocks/seek).

```tsx
import { ExpandingSearch } from './expanding-search'

;<ExpandingSearch onSearch={console.log} />
```

- `value` / `onChange` support controlled text; `defaultValue` defaults to an empty string.
- `onSearch` receives trimmed nonempty text on Enter; `label` / `placeholder`: `Search`.
- Escape clears and collapses; an empty field collapses on blur. `disabled`: `false`.
- Supports `className` and `style`; reduced motion disables decorative animation. Demo data and controls are separate from public exports.
