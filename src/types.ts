export interface HassEntity {
  entity_id: string
  state: string
  attributes: Record<string, any>
  last_changed: string
  last_updated: string
}

export interface HomeAssistant {
  states: Record<string, HassEntity>
  locale?: { language: string }
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, any>,
    target?: Record<string, any>
  ) => Promise<unknown>
}

export interface ActionConfig {
  action:
    | 'more-info'
    | 'none'
    | 'toggle'
    | 'navigate'
    | 'url'
    | 'call-service'
    | 'perform-action'
  navigation_path?: string
  url_path?: string
  service?: string
  perform_action?: string
  data?: Record<string, any>
  service_data?: Record<string, any>
  target?: Record<string, any>
}

export interface BinDefinition {
  /** short stable id — used for CSS hooks; defaults to a slug of the label */
  slug?: string
  /** text under / beside the chip and in the summary line */
  label: string
  /** MDI icon name, e.g. "mdi:recycle" */
  icon: string
  /** chip / badge accent colour — any CSS colour, or an HA colour token name (red, green, blue, …) */
  color?: string
  /**
   * Substring(s) to look for in the collection text for this date. Matching is
   * case-insensitive. Defaults to [label].
   */
  match?: string | string[]
}

export interface WheelieBinCardConfig {
  type: string
  /** the Waste Collection Schedule "detailed" sensor (date-keyed attributes) */
  entity: string
  /** card heading — default "Next Bin Collection" */
  title?: string
  /** override the whole bin list; when omitted a sensible default set is used */
  bins?: BinDefinition[]
  /** add a "Food scraps" chip to the default set (ignored if `bins` is set) */
  show_food_scraps?: boolean
  /** only render chips that are part of the next collection */
  hide_inactive?: boolean
  /** show the corner ✓ / ✗ badge on each chip — default true */
  show_badges?: boolean
  /** show the label under each chip */
  show_labels?: boolean
  /** chip diameter — number (px) or any CSS length. Default 44px. */
  chip_size?: string | number
  /** bin icon size — number (px) or any CSS length. Default 24px. */
  icon_size?: string | number
  /** corner tick / cross badge size — number (px) or any CSS length. Default scales with chip_size. */
  badge_size?: string | number
  /** gap between chips — number (px) or any CSS length. Default 12px. */
  chip_gap?: string | number
  /** "horizontal" (text left, chips right) or "vertical" (stacked, centred) */
  layout?: 'horizontal' | 'vertical'
  /** locale for day names / formatting — defaults to the HA locale */
  locale?: string
  tap_action?: ActionConfig
  hold_action?: ActionConfig
  double_tap_action?: ActionConfig
}

export interface ResolvedBin extends BinDefinition {
  slug: string
  active: boolean
}
