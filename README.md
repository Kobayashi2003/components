# Component Atlas

Component Atlas collects independently browsable React interface components and interaction experiments. Each entry has a live demo, usage notes, and source code. Public imports do not load showcase code.

## Get started

```bash
npm install
npm run dev
```

Open the local address printed by Vite. Before finishing a change, run `npm run lint` and `npm run build`; `npm run format:check` checks formatting.

## Repository map

| Path                             | Purpose                                                 |
| -------------------------------- | ------------------------------------------------------- |
| `src/App.tsx`, `src/styles.css`  | Catalog UI and global styles                            |
| `src/catalog/`                   | Categories, tags, entry validation, and lazy loading    |
| `src/components/`                | Components used by the catalog UI                       |
| `src/shared/`                    | Infrastructure unrelated to a specific entry            |
| `src/library/<category>/<slug>/` | An entry's component, demo, metadata, and documentation |

The catalog uses `#/`, `#/category/<category>`, and `#/entry/<category>/<slug>`. Metadata loads for the listing; demos and documentation load when an entry is opened.

## Categories

| Category            | Primary purpose                                      |
| ------------------- | ---------------------------------------------------- |
| `visual-effects`    | Lighting, texture, distortion, and visual treatments |
| `interactions`      | Gestures, dragging, and direct manipulation          |
| `layout-navigation` | Menus, navigation, and spatial layout                |
| `data-display`      | Information surfaces and media playback              |
| `forms-input`       | Fields, pickers, and editing                         |
| `feedback-status`   | Progress, notifications, and confirmation            |

Choose a category by the entry's main reusable idea; use tags for secondary qualities. Each category README explains its boundary.

## Add an entry

Follow the [library conventions](src/library/README.md). Create a slug directory in an existing category with a public entry, component, demo, metadata, and concise usage notes. Check the entry route, relevant keyboard and touch behavior, lint, and build. EPUB Reader keeps its separate package layout.

Add a category only when existing categories cannot describe the entry. Register it in `src/catalog/types.ts` and `src/catalog/catalog.ts`, then document its boundary in a category README.
