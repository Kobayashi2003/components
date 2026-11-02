# Components

Storage for reusable components, shown by Component Atlas
(`../sites/component-atlas`, which links this folder as `src/library`). Read
[README.md](README.md) before adding or changing an entry or a category.

- This folder has no toolchain. Run checks from `../sites/component-atlas`:
  `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`.
- EPUB Reader (`data-display/epub-reader/`) is its own package: follow its README
  and run its `pnpm check` after changing it.
- Never import from Component Atlas or from another entry.
- Entries have no `AGENTS.md` of their own; this file covers them all.
