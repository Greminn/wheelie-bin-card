# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What this is

A custom **Home Assistant Lovelace card** for the
[Waste Collection Schedule](https://github.com/mampfes/hacs_waste_collection_schedule)
(WCS) integration. Shows the next collection as a title + summary line and a row
of bin "chips" with a ✓/✗ badge each. TypeScript + [Lit](https://lit.dev),
bundled with Rollup. Distributed via HACS (custom repo) and GitHub releases.

Name: "Wheelie Bun (Bin) Card" — *bun* because NZ pronounces *bin* that way. The
docs deliberately lean into Kiwi humour; keep that voice in README/CHANGELOG.

## Commands

| | |
|---|---|
| `npm run build` | Rollup → `dist/wheelie-bin-card.js` (single ES module, terser-minified). `dist/` is **gitignored**. |
| `npm run lint` | ESLint, **`--max-warnings 0`** — CI and the release workflow fail on any warning. Always run before committing. |
| `npm start` | Dev server (`rollup.config.dev.js`) on `:5000`, watch mode, CORS open. |

No test suite. Verify by building, linting, and loading the card in a real HA
instance (see the local memory for the maintainer's HA + a deploy method).

## Source layout

| File | Contains |
|---|---|
| `src/wheelie-bin-card.ts` | The `wheelie-bin-card` element: render, `nextCollection()` / `collectionsByDate()`, `resolveBins()`, `summaryLine()` / `relativeDay()`, tap/hold/double-tap actions, `getStubConfig` / `getGridOptions`. Holds `CARD_VERSION`. |
| `src/editor.ts` | The `wheelie-bin-card-editor` element. Top half is an `ha-form` driven by `SCHEMA`; bottom half is a hand-rolled **Bins** panel (per-bin on/off `ha-switch`, drag-to-reorder via `ha-sortable`, collapsible rows with `ha-icon-picker` + `ha-selector` colour). |
| `src/defaults.ts` | `DEFAULT_BINS`, `FOOD_SCRAPS_BIN`, `KNOWN_BINS`, `LABEL_SETS` (te-reo / kiwi), `TE_REO_WEEKDAYS`, `KNOWN_COLORS`, and the pure functions `binSlug()`, `localizedBin()`, `effectiveBins()`. |
| `src/types.ts` | `WheelieBinCardConfig`, `BinDefinition`, and hand-written slices of the HA `hass` object (no `@types/home-assistant` — it doesn't exist). |
| `src/styles.ts` | The card's `css` template (editor styles live inline in `editor.ts`). |

## How the card works

- The `entity` is a WCS sensor with **`details_format: upcoming`**, whose
  attributes are keyed by date: `"2026-09-04": "Rubbish, Food scraps"`. Other
  `details_format` values (`appointment_types`, `generic`) do **not** produce
  these and won't work — this trips users up constantly, keep the README section
  on it strong.
- `entity` may be a **string or a list** (v0.4.1+). A list is merged by date in
  `collectionsByDate()` — supports the common WCS setup of one sensor per waste
  type. The editor stores a single sensor as a plain string, a list as an array.
- `resolveBins(text)` marks a bin active if `text` contains any of its `match`
  strings (case-insensitive substring), defaulting `match` to the label.
- **`match` must stay English** — the sensor always emits English type names.
  `DEFAULT_BINS` carry an explicit English `match` so a translated `label`
  (`labels: te-reo` / `kiwi`) can't break matching. Never let a translation flow
  into `match`.
- `effectiveBins(config)`: explicit `config.bins`, else the built-in set
  (+ `FOOD_SCRAPS_BIN` when `show_food_scraps`), with `LABEL_SETS[config.labels]`
  applied to labels, minus `config.disabled_bins`.

## Editor model

- The **Bins** panel edits three config keys: `bins`, `disabled_bins`,
  `show_food_scraps`.
- Toggling a bin off → adds its slug to `disabled_bins`. Toggling "Food scraps"
  on (while not materialised) → `show_food_scraps: true`.
- **Reordering or editing an icon/colour "materialises"** an explicit `bins`
  list (`materialize()` / `fullRoster()`), because order/appearance can't be
  expressed any other way. Once materialised, the `labels` dropdown no longer
  relabels (names are baked in) — **Reset bins to defaults** clears `bins` +
  `disabled_bins` + `show_food_scraps`.
- `emit()` strips `labels: 'english'` and collapses a 1-element `entity` array.
- HA frontend components used (`ha-form`, `ha-selector`, `ha-icon-picker`,
  `ha-sortable`, `ha-select-box` via `selector.select.mode: 'box'`): assume
  present, no import, degrade gracefully if absent.

## Config keys (see README for the full table)

`entity` (string|list, required), `title`, `layout` h/v, `chip_style`
faded/filled, `labels` english/te-reo/kiwi, `bins`, `show_food_scraps`,
`disabled_bins`, `hide_inactive`, `show_badges`, `show_labels`,
`chip_size` / `icon_size` / `badge_size` / `chip_gap`, `locale`,
`tap_action` / `hold_action` / `double_tap_action`.

## Releasing

The maintainer wants to be **asked before any version bump, commit, push, or
release** (see local memory) — but does direct them explicitly, in which case go
ahead.

1. Bump the version in **two** places: `package.json` `version` **and**
   `src/wheelie-bin-card.ts` `CARD_VERSION`. Keep them identical.
2. Add a `CHANGELOG.md` entry (Kiwi voice; link the issue if any).
3. Update `README.md` for any new/changed option.
4. `npm run lint && npm run build`.
5. Commit, push `main`. Commit trailers: `Co-Authored-By:` + `Claude-Session:`
   as configured. Use `Closes #N` to auto-close issues.
6. `gh release create vX.Y.Z --title "…" --notes "…"`. The
   `.github/workflows/release.yml` workflow then builds and **attaches
   `dist/wheelie-bin-card.js`** to the release (this is what HACS + manual
   installs download). Poll `gh run list --workflow=release.yml` and verify the
   asset with `gh release view`.

Published tags are immutable in practice — a force-push over one is blocked by
the tooling. Roll a new patch instead of moving a tag.

## Conventions

- 2-space indent, no semicolons (see existing files), single quotes.
- MDI glyphs are inlined as path-data constants (`mdiTrashCan`, `mdiDrag`, …) to
  avoid pulling in `@mdi/js`.
- Small inline SVGs go in as `data:image/svg+xml,` + `encodeURIComponent(...)`.
- `getGridOptions()` / `naturalHeight()` feed the HA sections grid — update the
  height estimate if you add vertical chrome to the card.
