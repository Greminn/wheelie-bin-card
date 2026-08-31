import { BinDefinition, WheelieBinCardConfig } from './types'

export const DEFAULT_BINS: BinDefinition[] = [
  { slug: 'rubbish', label: 'Rubbish', icon: 'mdi:trash-can', color: 'red' },
  { slug: 'garden', label: 'Garden waste', icon: 'mdi:leaf', color: 'green' },
  { slug: 'recycling', label: 'Recycling', icon: 'mdi:recycle', color: 'amber' },
  { slug: 'glass', label: 'Glass', icon: 'mdi:bottle-wine', color: 'blue' }
]

export const FOOD_SCRAPS_BIN: BinDefinition = {
  slug: 'food', label: 'Food scraps', icon: 'mdi:food-apple', color: 'light-green'
}

/** the effective bin list for a config: explicit `bins`, else the built-in set */
export function effectiveBins (config: WheelieBinCardConfig): BinDefinition[] {
  if (config.bins?.length) return config.bins
  return config.show_food_scraps ? [...DEFAULT_BINS, FOOD_SCRAPS_BIN] : DEFAULT_BINS
}

export const KNOWN_COLORS = new Set([
  'primary', 'accent', 'disabled', 'red', 'pink', 'purple', 'deep-purple', 'indigo',
  'blue', 'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime', 'yellow',
  'amber', 'orange', 'deep-orange', 'brown', 'grey', 'blue-grey', 'black', 'white'
])
