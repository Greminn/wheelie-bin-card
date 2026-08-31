import { LitElement, html, nothing, PropertyValues, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import styles from './styles'
import { HomeAssistant, WheelieBinCardConfig, BinDefinition, ResolvedBin } from './types'

const CARD_VERSION = '0.1.0'

console.info(
  `%c WHEELIE-BIN-CARD %c v${CARD_VERSION} `,
  'color: white; background: #55a15f; font-weight: 700;',
  'color: #55a15f; background: white; font-weight: 700;'
)

const w = window as any
w.customCards = w.customCards || []
w.customCards.push({
  type: 'wheelie-bin-card',
  name: 'Wheelie Bin Card',
  description: 'Next collection from the Waste Collection Schedule integration, with a check / cross per bin.',
  preview: false,
  documentationURL: 'https://github.com/Greminn/wheelie-bin-card'
})

const DEFAULT_BINS: BinDefinition[] = [
  { slug: 'rubbish', label: 'Rubbish', icon: 'mdi:trash-can', color: 'red' },
  { slug: 'garden', label: 'Garden waste', icon: 'mdi:leaf', color: 'green' },
  { slug: 'recycling', label: 'Recycling', icon: 'mdi:recycle', color: 'amber' },
  { slug: 'glass', label: 'Glass', icon: 'mdi:bottle-wine', color: 'blue' }
]

const FOOD_SCRAPS_BIN: BinDefinition = {
  slug: 'food', label: 'Food scraps', icon: 'mdi:food-apple', color: 'light-green'
}

const KNOWN_COLORS = new Set([
  'primary', 'accent', 'disabled', 'red', 'pink', 'purple', 'deep-purple', 'indigo',
  'blue', 'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime', 'yellow',
  'amber', 'orange', 'deep-orange', 'brown', 'grey', 'blue-grey', 'black', 'white'
])

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

@customElement('wheelie-bin-card')
export class WheelieBinCard extends LitElement {
  static styles = styles

  @property({ attribute: false }) public hass!: HomeAssistant
  @state() private config!: WheelieBinCardConfig

  public static getStubConfig (_hass: HomeAssistant, entities: string[]): Record<string, unknown> {
    const match = entities.find((e) => e.startsWith('sensor.') && /waste|rubbish|bin|collection/i.test(e))
    return { type: 'custom:wheelie-bin-card', entity: match ?? 'sensor.waste_collection' }
  }

  public setConfig (config: WheelieBinCardConfig): void {
    if (!config || !config.entity) {
      throw new Error('wheelie-bin-card: "entity" is required')
    }
    this.config = config
  }

  public getCardSize (): number {
    return 1
  }

  public getGridOptions (): Record<string, unknown> {
    return { rows: 1, min_rows: 1, columns: 12, min_columns: 6 }
  }

  protected shouldUpdate (changed: PropertyValues): boolean {
    if (changed.has('config')) return true
    const oldHass = changed.get('hass') as HomeAssistant | undefined
    if (!oldHass || !this.config) return true
    return oldHass.states[this.config.entity] !== this.hass.states[this.config.entity]
  }

  private get bins (): BinDefinition[] {
    if (this.config.bins?.length) return this.config.bins
    return this.config.show_food_scraps ? [...DEFAULT_BINS, FOOD_SCRAPS_BIN] : DEFAULT_BINS
  }

  /** the earliest date-keyed attribute that is today or later (else the earliest of all) */
  private nextCollection (): { date: Date, text: string } | undefined {
    const stateObj = this.hass.states[this.config.entity]
    if (!stateObj) return undefined
    const keys = Object.keys(stateObj.attributes).filter((k) => DATE_KEY.test(k)).sort()
    if (!keys.length) return undefined
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const key = keys.find((k) => new Date(`${k}T00:00:00`) >= today) ?? keys[0]
    const raw = stateObj.attributes[key]
    const text = Array.isArray(raw) ? raw.join(', ') : String(raw ?? '')
    return { date: new Date(`${key}T00:00:00`), text }
  }

  private resolveBins (text: string): ResolvedBin[] {
    const haystack = text.toLowerCase()
    return this.bins.map((bin, i) => {
      const needles = bin.match === undefined
        ? [bin.label]
        : Array.isArray(bin.match) ? bin.match : [bin.match]
      const active = needles.some((n) => haystack.includes(String(n).toLowerCase()))
      return { ...bin, slug: bin.slug || slugify(bin.label) || `bin-${i}`, active }
    })
  }

  private relativeDay (date: Date): string {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.round((date.getTime() - today.getTime()) / 86400000)
    const locale = this.config.locale ?? this.hass.locale?.language ?? 'en-GB'
    if (diff <= 0) return 'today'
    if (diff === 1) return 'tomorrow'
    const weekday = date.toLocaleDateString(locale, { weekday: 'long' })
    if (diff < 7) return `this ${weekday}`
    if (diff < 14) return `next ${weekday}`
    return `on ${date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}`
  }

  private summaryLine (bins: ResolvedBin[], date: Date): string {
    const labels = bins.filter((b) => b.active).map((b) => b.label)
    const when = this.relativeDay(date)
    if (!labels.length) return `Nothing scheduled ${when}`
    let list: string
    if (labels.length === 1) list = labels[0]
    else if (labels.length === 2) list = `${labels[0]} & ${labels[1]}`
    else list = `${labels.slice(0, -1).join(', ')} & ${labels[labels.length - 1]}`
    return `${list} ${when}`
  }

  protected render (): TemplateResult {
    if (!this.config || !this.hass) return html``
    const stateObj = this.hass.states[this.config.entity]
    const title = this.config.title ?? 'Next Bin Collection'

    if (!stateObj) {
      return html`<ha-card><div class="error">Entity not found: ${this.config.entity}</div></ha-card>`
    }

    const next = this.nextCollection()
    const clickable = this.config.tap_action?.action !== 'none'

    if (!next) {
      return html`<ha-card>
        <div class="wrap">
          <div class="text">
            <div class="title">${title}</div>
            <div class="summary">No upcoming collection data</div>
          </div>
        </div>
      </ha-card>`
    }

    const bins = this.resolveBins(next.text)
    const shown = this.config.hide_inactive ? bins.filter((b) => b.active) : bins

    return html`
      <ha-card
        class=${classMap({ clickable })}
        @click=${clickable ? this._handleClick : undefined}
      >
        <div class="wrap">
          <div class="text">
            <div class="title">${title}</div>
            <div class="summary">${this.summaryLine(bins, next.date)}</div>
          </div>
          <div class="chips">
            ${shown.map((bin) => this.renderChip(bin))}
          </div>
        </div>
      </ha-card>
    `
  }

  private renderChip (bin: ResolvedBin): TemplateResult {
    return html`
      <div
        class=${classMap({ chip: true, active: bin.active })}
        data-bin=${bin.slug}
        title=${bin.label}
        style=${`--bcc-accent: ${resolveColor(bin.color)};`}
      >
        <div class="disc">
          <ha-icon .icon=${bin.icon}></ha-icon>
          <div class="badge">
            <ha-icon .icon=${bin.active ? 'mdi:check-bold' : 'mdi:close-thick'}></ha-icon>
          </div>
        </div>
        ${this.config.show_labels ? html`<div class="label">${bin.label}</div>` : nothing}
      </div>
    `
  }

  private _handleClick = (): void => {
    const a = this.config.tap_action ?? { action: 'more-info' }
    switch (a.action) {
      case 'none':
        return
      case 'toggle':
        this.hass.callService('homeassistant', 'toggle', { entity_id: this.config.entity })
        return
      case 'navigate':
        if (a.navigation_path) {
          history.pushState(null, '', a.navigation_path)
          this.dispatchEvent(new Event('location-changed', { bubbles: true, composed: true }))
        }
        return
      case 'url':
        if (a.url_path) window.open(a.url_path, a.url_path.startsWith('/') ? '_self' : '_blank')
        return
      case 'call-service':
      case 'perform-action': {
        const svc = a.perform_action ?? a.service
        if (!svc || !svc.includes('.')) return
        const [domain, service] = svc.split('.')
        this.hass.callService(domain, service, a.data ?? a.service_data, a.target)
        return
      }
      default:
        this.dispatchEvent(new CustomEvent('hass-more-info', {
          detail: { entityId: this.config.entity },
          bubbles: true,
          composed: true
        }))
    }
  }
}

function slugify (s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function resolveColor (color?: string): string {
  if (!color) return 'var(--bcc-chip-bg, rgba(150, 150, 150, 0.16))'
  return KNOWN_COLORS.has(color) ? `var(--${color}-color)` : color
}

declare global {
  interface HTMLElementTagNameMap {
    'wheelie-bin-card': WheelieBinCard
  }
}
