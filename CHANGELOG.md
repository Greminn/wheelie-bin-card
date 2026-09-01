# Changelog

All notable changes to the Wheelie Bun (Bin) Card. Chur.

## 0.4.0

The "sort your bins out" release.

### Added

- **`labels` option** — pick the built-in bin names in `english` (default),
  `te-reo`, or `kiwi`. Matching still uses the English term, so switching is
  safe.
  - `te-reo`: Para, Tapahanga māra, Hangarua, Karaehe, Para kai — and te reo
    weekday names in the summary line (Rāhina, Rātū, …). Connecting words stay
    English.
  - `kiwi`: Garbage, Garden guff, Cans and cardboard, Empties, Chook bucket.
- **Per-bin on/off switches in the visual editor** — flick Glass off where
  there's no glass collection, no YAML required.
- **`disabled_bins` option** — the YAML equivalent, e.g. `["glass"]`. Works on
  the built-in set and on a custom `bins` list.
- **Drag-to-reorder bins** in the editor — chip order follows the list.
- **Collapsible bin rows** — each row opens to its icon and colour pickers
  instead of everything being on screen at once.
- **Layout** and **Chip style** are now pick-a-picture cards in the editor,
  matching Home Assistant's own tile-card selectors.

### Changed

- Built-in bins now carry an explicit English `match`, so a translated `label`
  can't break collection matching.
- Editing a bin's icon/colour, or reordering, writes an explicit `bins` list —
  **Reset bins to defaults** in the editor undoes it.

## 0.3.2

- Renamed the project to "Wheelie Bun (Bin) Card".

## 0.3.1

- Fixed badge ticks not rendering; added screenshot.

## 0.3.0

- `chip_style` option; badge and layout fixes.

## 0.2.0

- Layout, sizing, per-bin styling, richer editor.

## 0.1.0

- Initial release.
