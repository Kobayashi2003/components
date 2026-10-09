# Components

Reusable React components and interaction experiments, one directory per entry.
This folder is only storage: it has no build of its own. Component Atlas
(`../sites/component-atlas`) links to it as `src/library` and is where entries are
browsed, type-checked, linted and built.

```text
components/
├── types.ts            # ComponentMeta: the contract every meta.ts satisfies
├── tags.ts             # Registered tag IDs
├── <category>/
│   ├── README.md       # Makes the directory a category
│   └── <slug>/         # One entry
```

EPUB Reader (`data-display/epub-reader/`) is its own package and is exempt from
the entry layout below; follow its README and run its `pnpm check`.

## Categories

Every directory here with a `README.md` is a category; Component Atlas finds them
on its own. The README's heading is the category title, and the first sentence of
its first paragraph is the description shown on the category card. The rest of the
README explains the category's boundary.

Choose a category by the entry's main reusable idea; use tags for secondary
qualities. Add a category only when existing ones cannot describe the entry.

## Entry layout

```text
<category>/<slug>/
├── index.ts                 # Named public exports and runtime CSS
├── ComponentName.tsx        # Main public component
├── styles.css               # Runtime styles
├── meta.ts                  # Catalog metadata
├── README.md                # Usage and necessary constraints
├── thumbnail.webp           # Optional catalog preview
├── demo/                    # Showcase, its styles, and demo-only assets
├── components/              # Supporting components, optionally re-exported
├── hooks/                   # Entry-specific hooks
└── <domain>/                # Responsibility folders such as media/ or rendering/
```

Keep identification, public entry points, and the main component at the entry root. A model or algorithm shared across several responsibilities may also stay there. Put files serving one responsibility in its subdirectory. Do not create empty folders, a nested `src/` by default, or a catch-all `utils/`. Demo assets belong in `demo/`; runtime assets belong in `assets/`.

An entry is self-contained: it imports only from itself, `react`, and the type
contract in `types.ts`, never from another entry or from Component Atlas. A new
runtime package is declared in Component Atlas's `package.json`, since that is
where entries are built.

`index.ts` imports runtime CSS and uses named exports; it never imports the demo. `demo/index.tsx` default-exports the Showcase and consumes the public entry through `..`. Keep demo controls, fixtures, and styles in `demo/`. Preserve established compatibility aliases when moving public exports.

## Metadata and documentation

`meta.ts` default-exports an object that `satisfies ComponentMeta` (from `../../types`). The category and slug must match the directory. Tags use registered IDs from `tags.ts`. `usage` distinguishes `reusable` from `showcase`. Claim keyboard, touch, and reduced-motion capabilities only after checking them. A root-level `thumbnail.webp` is discovered automatically.

For reusable components, keep the README in this order: one sentence describing its purpose, `Usage` with a working import/render example, `Props` with key defaults, and `Notes` only for necessary interaction or resource constraints. Use a three-column `Prop | Default | Description` table. Mark required props `Required`, optional props without a default `—`, and group closely related props only when they share one explanation. For a fixed showcase, omit `Props` unless it has a real public option. Avoid demo implementation details and repeated repository conventions.

## Interaction and checks

Effect roots accept `className`, `style`, and `disabled`. The root defines pointer-tracking bounds; documentation names the affected targets separately. Selection effects use default data attributes with optional selectors. Smoothing is a follow factor from 0.01 to 1, with larger values following faster. Distances are CSS pixels; durations are milliseconds. Put tuning panels in the demo, outside the effect.

Preserve child interaction, clean up listeners and media resources, and account for touch and reduced motion. Add nearby tests only for behavior with a concrete regression risk.

After a change, run from `../sites/component-atlas`: `pnpm typecheck`, `pnpm lint`,
`pnpm format:check` and `pnpm build`, then open the entry route
(`#/entry/<category>/<slug>`) and check that public imports work without demo CSS.
