# Wheelie Bin Card

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

A small Home Assistant Lovelace card for the
[**Waste Collection Schedule**](https://github.com/mampfes/hacs_waste_collection_schedule)
integration (`mampfes/hacs_waste_collection_schedule`). It shows the next collection
as a title + summary line and a row of bin "chips", each with a ✓ or ✗ badge for
whether that bin goes out next time.

> Next Bin Collection
> **Recycling & Glass this Friday** &nbsp;&nbsp; 🗑️✗ 🍂✗ ♻️✓ 🍾✓

## Requirements

The `entity` must be a **Waste Collection Schedule sensor whose attributes are
keyed by date**, each value being the collection type(s) for that day, e.g.:

```yaml
# sensor.waste_collection_schedule_… attributes
2026-09-04: "Rubbish, Food scraps, Garden waste"
2026-09-11: "Recycling, Food scraps, Glass"
```

That is the shape produced by a Waste Collection Schedule `sensor` configured
with `value_template` / details that emit per-date attributes (the common
"detailed upcoming" setup). The card reads the earliest date that is today or
later.

## Installation

### HACS (custom repository)

1. HACS → ⋮ → **Custom repositories** → add
   `https://github.com/Greminn/wheelie-bin-card`, category **Dashboard**.
2. Install **Wheelie Bin Card**.
3. HACS adds the resource automatically. If not, add it manually:
   `/hacsfiles/wheelie-bin-card/wheelie-bin-card.js` (type: `module`).

### Manual

1. Download `wheelie-bin-card.js` from the
   [latest release](https://github.com/Greminn/wheelie-bin-card/releases/latest)
   into `config/www/`.
2. Add a Lovelace resource: `/local/wheelie-bin-card.js` (type: `module`).

## Configuration

```yaml
type: custom:wheelie-bin-card
entity: sensor.waste_collection_schedule_my_council
```

### Options

| Name | Type | Default | Description |
|---|---|---|---|
| `type` | string | — | `custom:wheelie-bin-card` |
| `entity` | string | — | **Required.** The date-keyed Waste Collection Schedule sensor. |
| `title` | string | `Next Bin Collection` | Card heading. |
| `layout` | `horizontal` \| `vertical` | `horizontal` | `horizontal` = text left, chips right; `vertical` = stacked and centred. |
| `bins` | list | *(built-in set)* | Override the bin list entirely — see below. |
| `show_food_scraps` | boolean | `false` | Add a "Food scraps" chip to the built-in set (ignored when `bins` is given). |
| `hide_inactive` | boolean | `false` | Only render chips that are part of the next collection. |
| `show_badges` | boolean | `true` | Show the corner ✓ / ✗ badge on each chip. |
| `show_labels` | boolean | `false` | Show each bin's label under its chip. |
| `chip_size` | number \| string | `44` | Chip (circle) diameter — number is px. |
| `icon_size` | number \| string | `24` | Bin icon size — number is px. |
| `badge_size` | number \| string | *(scales with `chip_size`)* | ✓ / ✗ badge diameter — number is px. |
| `chip_gap` | number \| string | `12` | Gap between chips — number is px. |
| `locale` | string | *(HA locale)* | Locale for day names, e.g. `en-NZ`. |
| `tap_action` | action | `more-info` | Standard HA action object. `{ action: none }` disables the click. |
| `hold_action` | action | *(none)* | Standard HA action object. |
| `double_tap_action` | action | *(none)* | Standard HA action object. |

A visual editor is provided — entity, a **Content** section (title, layout, toggles,
sizes, locale), an **Interactions** section (tap / hold / double-tap), and a
**Bins** section with a per-bin icon and colour picker.

### Built-in bin set

Used when `bins` is not supplied:

| slug | label | icon | colour | matches when the collection text contains |
|---|---|---|---|---|
| `rubbish` | Rubbish | `mdi:trash-can` | red | "Rubbish" |
| `garden` | Garden waste | `mdi:leaf` | green | "Garden waste" |
| `recycling` | Recycling | `mdi:recycle` | amber | "Recycling" |
| `glass` | Glass | `mdi:bottle-wine` | blue | "Glass" |

With `show_food_scraps: true` a `food` / "Food scraps" / `mdi:food-apple` / light-green
chip is appended.

### Custom bins

```yaml
type: custom:wheelie-bin-card
entity: sensor.waste_collection_schedule_my_council
bins:
  - label: Landfill
    icon: mdi:trash-can
    color: "#e15241"
    match: ["Rubbish", "General waste"]   # any of these substrings ⇒ active
  - label: Recycling
    icon: mdi:recycle
    color: amber
  - label: Organics
    icon: mdi:leaf
    color: green
    match: Garden          # defaults to the label if omitted
```

`color` accepts any CSS colour or a Home Assistant colour token name
(`red`, `green`, `blue`, `amber`, `teal`, …).

### CSS custom properties

| Property | Default | Purpose |
|---|---|---|
| `--bcc-chip-size` | `44px` | Diameter of each bin chip (or use `chip_size`). |
| `--bcc-icon-size` | `24px` | Bin icon size (or use `icon_size`). |
| `--bcc-badge-size` | scales with chip | ✓ / ✗ badge size (or use `badge_size`). |
| `--bcc-chip-gap` | `12px` | Gap between chips (or use `chip_gap`). |
| `--bcc-chip-bg` | `rgba(150,150,150,0.16)` | Background of an inactive chip. |

## Notes

Not affiliated with the Waste Collection Schedule project — it just consumes that
integration's sensor.

## License

MIT
