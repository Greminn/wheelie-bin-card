import { LitElement, html, nothing, PropertyValues, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'

import styles from './styles'
import { ActionConfig, HomeAssistant, WheelieBinCardConfig, BinDefinition, ResolvedBin } from './types'
import { effectiveBins, KNOWN_COLORS } from './defaults'
import './editor'

const CARD_VERSION = '0.3.0'

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

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

@customElement('wheelie-bin-card')
export class WheelieBinCard extends LitElement {
  static styles = styles

  @property({ attribute: false }) public hass!: HomeAssistant
  @state() private config!: WheelieBinCardConfig

  private holdTimer?: number
  private clickTimer?: number
  private held = false

  public static getConfigElement (): HTMLElement {
    return document.createElement('wheelie-bin-card-editor')
  }

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

  /** rough natural content height in px, for grid/masonry sizing */
  private naturalHeight (): number {
    const c = this.config ?? ({} as WheelieBinCardConfig)
    const chip = Number(sizeNum(c.chip_size)) || 36
    const labels = c.show_labels ? 16 : 0
    const text = 34 // title + summary, tight
    const pad = 16 // ha-card vertical padding
    return c.layout === 'vertical'
      ? pad + text + 10 + chip + labels
      : pad + Math.max(text, chip + labels)
  }

  public getCardSize (): number {
    return Math.max(1, Math.round(this.naturalHeight() / 50))
  }

  public getGridOptions (): Record<string, unknown> {
    // report the real height so the section grid gives the card a slot that
    // fits — otherwise a default 1-row slot leaves content overflowing
    const rows = Math.max(1, Math.ceil((this.naturalHeight() + 8) / 64))
    return { rows, min_rows: 1, columns: 12, min_columns: 6 }
  }

  public disconnectedCallback (): void {
    super.disconnectedCallback()
    clearTimeout(this.holdTimer)
    clearTimeout(this.clickTimer)
  }

  protected shouldUpdate (changed: PropertyValues): boolean {
    if (!this.config) return false
    if (changed.has('config')) return true
    const oldHass = changed.get('hass') as HomeAssistant | undefined
    if (!oldHass) return true
    return oldHass.states[this.config.entity] !== this.hass.states[this.config.entity] ||
      oldHass.locale?.language !== this.hass.locale?.language
  }

  private get bins (): BinDefinition[] {
    return effectiveBins(this.config)
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
    const vertical = this.config.layout === 'vertical'
    const interactive = this.config.tap_action?.action !== 'none'

    const cardStyle = styleMap({
      '--bcc-chip-size': sizePx(this.config.chip_size),
      '--bcc-icon-size': sizePx(this.config.icon_size),
      '--bcc-badge-size': sizePx(this.config.badge_size),
      '--bcc-chip-gap': sizePx(this.config.chip_gap)
    })

    if (!stateObj) {
      return html`<ha-card style=${cardStyle}><div class="error">Entity not found: ${this.config.entity}</div></ha-card>`
    }

    const next = this.nextCollection()
    const summary = next
      ? this.summaryLine(this.resolveBins(next.text), next.date)
      : 'No upcoming collection data'
    const bins = next ? this.resolveBins(next.text) : []
    const shown = this.config.hide_inactive ? bins.filter((b) => b.active) : bins

    return html`
      <ha-card
        class=${classMap({ clickable: interactive })}
        style=${cardStyle}
        @pointerdown=${interactive ? this._onPointerDown : undefined}
        @pointerup=${interactive ? this._onPointerUp : undefined}
        @pointercancel=${interactive ? this._onPointerCancel : undefined}
        @click=${interactive ? this._onClick : undefined}
      >
        <div class=${classMap({ wrap: true, vertical, filled: this.config.chip_style === 'filled' })}>
          <div class="text">
            <div class="title">${title}</div>
            <div class="summary">${summary}</div>
          </div>
          ${shown.length
            ? html`<div class="chips">${shown.map((bin) => this.renderChip(bin))}</div>`
            : nothing}
        </div>
      </ha-card>
    `
  }

  private renderChip (bin: ResolvedBin): TemplateResult {
    const accent = resolveColor(bin.color)
    return html`
      <div
        class=${classMap({ chip: true, active: bin.active })}
        data-bin=${bin.slug}
        title=${bin.label}
        style=${`--bcc-accent: ${accent}; --bcc-accent-faded: color-mix(in srgb, ${accent} 22%, transparent);`}
      >
        <div class="disc">
          <ha-icon .icon=${bin.icon}></ha-icon>
          ${this.config.show_badges === false
            ? nothing
            : html`<div class="badge">
                <ha-icon .icon=${bin.active ? 'mdi:check-bold' : 'mdi:close-thick'}></ha-icon>
              </div>`}
        </div>
        ${this.config.show_labels ? html`<div class="label">${bin.label}</div>` : nothing}
      </div>
    `
  }

  private _onPointerDown = (): void => {
    this.held = false
    clearTimeout(this.holdTimer)
    this.holdTimer = window.setTimeout(() => {
      this.held = true
      this._runAction(this.config.hold_action)
    }, 500)
  }

  private _onPointerUp = (): void => {
    clearTimeout(this.holdTimer)
  }

  private _onPointerCancel = (): void => {
    clearTimeout(this.holdTimer)
    this.held = false
  }

  private _onClick = (): void => {
    if (this.held) {
      this.held = false
      return
    }
    const dbl = this.config.double_tap_action
    if (dbl && dbl.action !== 'none') {
      if (this.clickTimer) {
        clearTimeout(this.clickTimer)
        this.clickTimer = undefined
        this._runAction(dbl)
      } else {
        this.clickTimer = window.setTimeout(() => {
          this.clickTimer = undefined
          this._runAction(this.config.tap_action ?? { action: 'more-info' })
        }, 250)
      }
      return
    }
    this._runAction(this.config.tap_action ?? { action: 'more-info' })
  }

  private _runAction (a?: ActionConfig): void {
    if (!a || a.action === 'none') return
    switch (a.action) {
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
      case 'more-info':
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

function sizePx (v?: string | number): string | undefined {
  if (v === undefined || v === null || v === '') return undefined
  const s = String(v).trim()
  return /^-?\d+(\.\d+)?$/.test(s) ? `${s}px` : s
}

/** numeric part of a size config value, or undefined if it isn't a plain number */
function sizeNum (v?: string | number): number | undefined {
  if (v === undefined || v === null || v === '') return undefined
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? n : undefined
}

function resolveColor (color?: string): string {
  if (!color || color === 'state') return 'var(--bcc-chip-bg)'
  return KNOWN_COLORS.has(color) ? `var(--${color}-color)` : color
}

declare global {
  interface HTMLElementTagNameMap {
    'wheelie-bin-card': WheelieBinCard
  }
}
