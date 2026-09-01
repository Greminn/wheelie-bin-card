import { BinDefinition, WheelieBinCardConfig } from './types'

// `match` is pinned to the English term — the Waste Collection Schedule sensor
// always emits English, so a translated `label` must not drive matching.
export const DEFAULT_BINS: BinDefinition[] = [
  { slug: 'rubbish', label: 'Rubbish', match: 'Rubbish', icon: 'mdi:trash-can', color: 'red' },
  { slug: 'garden', label: 'Garden waste', match: 'Garden waste', icon: 'mdi:leaf', color: 'green' },
  { slug: 'recycling', label: 'Recycling', match: 'Recycling', icon: 'mdi:recycle', color: 'amber' },
  { slug: 'glass', label: 'Glass', match: 'Glass', icon: 'mdi:bottle-wine', color: 'blue' }
]

export const FOOD_SCRAPS_BIN: BinDefinition = {
  slug: 'food', label: 'Food scraps', match: 'Food scraps', icon: 'mdi:food-apple', color: 'light-green'
}

/** every bin the editor knows how to switch on without a code-editor entry */
export const KNOWN_BINS: BinDefinition[] = [...DEFAULT_BINS, FOOD_SCRAPS_BIN]

/** alternate names for the built-in bins, keyed by slug */
export const LABEL_SETS: Record<string, Record<string, string>> = {
  'te-reo': {
    rubbish: 'Para',
    garden: 'Tapahanga māra',
    recycling: 'Hangarua',
    glass: 'Karaehe',
    food: 'Para kai'
  },
  kiwi: {
    rubbish: 'Garbage',
    garden: 'Garden guff',
    recycling: 'Cans and cardboard',
    glass: 'Empties',
    food: 'Chook bucket'
  }
}

/** te reo Māori weekday names, indexed by Date.getDay() (0 = Sunday) */
export const TE_REO_WEEKDAYS = [
  'Rātapu', 'Rāhina', 'Rātū', 'Rāapa', 'Rāpare', 'Rāmere', 'Rāhoroi'
]

/** short stable id for a bin — its `slug`, else a slug derived from the label */
export function binSlug (bin: BinDefinition): string {
  return bin.slug || bin.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** a built-in bin with its label swapped for the `labels` set, if one applies */
export function localizedBin (bin: BinDefinition, labels?: string): BinDefinition {
  const alt = labels ? LABEL_SETS[labels]?.[binSlug(bin)] : undefined
  return alt ? { ...bin, label: alt } : bin
}

/** the effective bin list for a config: explicit `bins`, else the built-in set, minus `disabled_bins` */
export function effectiveBins (config: WheelieBinCardConfig): BinDefinition[] {
  let base: BinDefinition[]
  if (config.bins?.length) {
    base = config.bins
  } else {
    base = config.show_food_scraps ? [...DEFAULT_BINS, FOOD_SCRAPS_BIN] : [...DEFAULT_BINS]
    base = base.map((b) => localizedBin(b, config.labels))
  }
  if (!config.disabled_bins?.length) return base
  const off = new Set(config.disabled_bins)
  return base.filter((b) => !off.has(binSlug(b)))
}

export const KNOWN_COLORS = new Set([
  'primary', 'accent', 'disabled', 'red', 'pink', 'purple', 'deep-purple', 'indigo',
  'blue', 'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime', 'yellow',
  'amber', 'orange', 'deep-orange', 'brown', 'grey', 'blue-grey', 'black', 'white'
])
