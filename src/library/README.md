# Library conventions

Ordinary entries live at `<category>/<slug>/` and are discovered by `src/catalog/catalog.ts`. EPUB Reader keeps its own package structure and is exempt from this layout.

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

Keep identification, public entry points, and the main component at the entry root. A model or algorithm shared across several responsibilities may also stay there. Put files serving one responsibility in its subdirectory. Do not create empty folders, a nested `src/` by default, or a catch-all `utils/`. Demo assets belong in `demo/`; runtime assets belong in `assets/`. `src/shared/` is reserved for catalog infrastructure unrelated to individual entries.

`index.ts` imports runtime CSS and uses named exports; it never imports the demo. `demo/index.tsx` default-exports the Showcase and consumes the public entry through `..`. Keep demo controls, fixtures, and styles in `demo/`. Preserve established compatibility aliases when moving public exports.

## Metadata and documentation

The category and slug in `meta.ts` must match the directory. Tags use registered IDs from `src/catalog/tags.ts`. `usage` distinguishes `reusable` from `showcase`. Claim keyboard, touch, and reduced-motion capabilities only after checking them. A root-level `thumbnail.webp` is discovered automatically.

For reusable components, keep the README in this order: one sentence describing its purpose, `Usage` with a working import/render example, `Props` with key defaults, and `Notes` only for necessary interaction or resource constraints. Use a three-column `Prop | Default | Description` table. Mark required props `Required`, optional props without a default `—`, and group closely related props only when they share one explanation. For a fixed showcase, omit `Props` unless it has a real public option. Avoid demo implementation details and repeated repository conventions.

## Interaction and checks

Effect roots accept `className`, `style`, and `disabled`. The root defines pointer-tracking bounds; documentation names the affected targets separately. Selection effects use default data attributes with optional selectors. Smoothing is a follow factor from 0.01 to 1, with larger values following faster. Distances are CSS pixels; durations are milliseconds. Put tuning panels in the demo, outside the effect.

Preserve child interaction, clean up listeners and media resources, and account for touch and reduced motion. After changes, check that public imports work without demo CSS, then run lint, build, and relevant interaction checks. `npm run format` formats the repository; EPUB Reader is excluded. Add nearby tests only for behavior with a concrete regression risk.
