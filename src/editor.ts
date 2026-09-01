import { LitElement, css, html, nothing, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import { HomeAssistant, WheelieBinCardConfig, BinDefinition } from './types'
import { effectiveBins, binSlug, localizedBin, KNOWN_BINS, KNOWN_COLORS, FOOD_SCRAPS_BIN } from './defaults'

// MDI path data (avoids pulling in @mdi/js just for a few glyphs)
const mdiTextShort = 'M4,9H20V11H4V9M4,13H14V15H4V13'
const mdiGestureTap =
  'M10,9A1,1 0 0,1 11,8A1,1 0 0,1 12,9V13.47L13.21,13.6L18.15,15.79C18.68,16.03 19,16.56 19,17.14V21.5' +
  'C18.97,22.32 18.32,22.97 17.5,23H11C10.62,23 10.26,22.85 10,22.57L5.1,18.37L5.84,17.6C6.03,17.39 6.3,17.28 ' +
  '6.58,17.28H6.8L10,19V9M11,5A4,4 0 0,1 15,9C15,10.5 14.2,11.77 13,12.46V11.24C13.61,10.69 14,9.89 14,9A3,3 0 ' +
  '0,0 11,6A3,3 0 0,0 8,9C8,9.89 8.39,10.69 9,11.24V12.46C7.8,11.77 7,10.5 7,9A4,4 0 0,1 11,5Z'
const mdiTrashCan =
  'M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z'
const mdiChevronDown = 'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z'
const mdiDrag =
  'M7,19V17H9V19H7M11,19V17H13V19H11M15,19V17H17V19H15M7,15V13H9V15H7M11,15V13H13V15H11M15,' +
  '15V13H17V15H15M7,11V9H9V11H7M11,11V9H13V11H11M15,11V9H17V11H15M7,7V5H9V7H7M11,7V5H13V7H11M15,7V5H17V7H15Z'

/** CSS colour for a bin's swatch — an HA colour token resolves to its variable */
function swatchColor (color?: string): string {
  if (!color || color === 'state') return 'var(--secondary-text-color)'
  return KNOWN_COLORS.has(color) ? `var(--${color}-color)` : color
}

const sizeSelector = { number: { min: 8, max: 120, mode: 'box', unit_of_measurement: 'px' } }

/** a tiny mockup thumbnail for a "box" select option */
const svgThumb = (body: string): string =>
  'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" fill="none" stroke="#8a8a8a">${body}</svg>`
  )

const layoutThumbH = svgThumb(
  '<rect x="5" y="16" width="46" height="24" rx="6" stroke-width="2"/>' +
  '<circle cx="18" cy="28" r="6" fill="#8a8a8a"/>' +
  '<rect x="28" y="24" width="16" height="3.5" rx="1.75" fill="#8a8a8a" stroke="none"/>' +
  '<rect x="28" y="30.5" width="10" height="3.5" rx="1.75" fill="#8a8a8a" stroke="none"/>'
)
const layoutThumbV = svgThumb(
  '<rect x="16" y="5" width="24" height="46" rx="6" stroke-width="2"/>' +
  '<circle cx="28" cy="18" r="6" fill="#8a8a8a"/>' +
  '<rect x="18" y="28" width="20" height="3.5" rx="1.75" fill="#8a8a8a" stroke="none"/>' +
  '<rect x="21" y="34.5" width="14" height="3.5" rx="1.75" fill="#8a8a8a" stroke="none"/>'
)
const chipThumbFaded = svgThumb(
  '<circle cx="28" cy="28" r="16" fill="#8a8a8a" fill-opacity="0.25" stroke="none"/>' +
  '<circle cx="28" cy="28" r="7" fill="#8a8a8a" stroke="none"/>'
)
const chipThumbFilled = svgThumb(
  '<circle cx="28" cy="28" r="16" fill="#8a8a8a" stroke="none"/>' +
  '<circle cx="28" cy="28" r="7" fill="#1c1c1c" stroke="none"/>'
)

const SCHEMA = [
  { name: 'entity', required: true, selector: { entity: { domain: 'sensor', multiple: true } } },
  {
    name: 'content',
    type: 'expandable',
    flatten: true,
    iconPath: mdiTextShort,
    schema: [
      { name: 'title', selector: { text: {} } },
      {
        name: 'layout',
        selector: {
          select: {
            mode: 'box',
            options: [
              { value: 'horizontal', label: 'Horizontal', description: 'Text left, chips right', image: layoutThumbH },
              { value: 'vertical', label: 'Vertical', description: 'Stacked and centred', image: layoutThumbV }
            ]
          }
        }
      },
      {
        name: 'chip_style',
        selector: {
          select: {
            mode: 'box',
            options: [
              { value: 'faded', label: 'Faded', description: 'Colour icon on a tinted disc', image: chipThumbFaded },
              { value: 'filled', label: 'Filled', description: 'White icon on a solid disc', image: chipThumbFilled }
            ]
          }
        }
      },
      {
        name: 'labels',
        selector: {
          select: {
            mode: 'dropdown',
            options: [
              { value: 'english', label: 'English' },
              { value: 'te-reo', label: 'Te reo Māori (Para, Hangarua, …)' },
              { value: 'kiwi', label: 'Kiwi slang (Garbage, Empties, …)' }
            ]
          }
        }
      },
      {
        name: '',
        type: 'grid',
        schema: [
          { name: 'show_badges', selector: { boolean: {} } },
          { name: 'show_labels', selector: { boolean: {} } },
          { name: 'hide_inactive', selector: { boolean: {} } }
        ]
      },
      {
        name: '',
        type: 'grid',
        schema: [
          { name: 'chip_size', selector: sizeSelector },
          { name: 'icon_size', selector: sizeSelector },
          { name: 'badge_size', selector: sizeSelector },
          { name: 'chip_gap', selector: sizeSelector }
        ]
      },
      { name: 'locale', selector: { text: {} } }
    ]
  },
  {
    name: 'interactions',
    type: 'expandable',
    flatten: true,
    iconPath: mdiGestureTap,
    schema: [
      { name: 'tap_action', selector: { ui_action: { default_action: 'more-info' } } },
      { name: 'hold_action', selector: { ui_action: {} } },
      { name: 'double_tap_action', selector: { ui_action: {} } }
    ]
  }
] as const

const LABELS: Record<string, string> = {
  entity: 'Waste Collection Schedule sensor(s)',
  content: 'Content',
  interactions: 'Interactions',
  title: 'Title',
  layout: 'Layout',
  chip_style: 'Chip style',
  labels: 'Bin names',
  show_badges: 'Badges (✓ / ✗)',
  hide_inactive: 'Hide inactive bins',
  show_labels: 'Labels under chips',
  chip_size: 'Chip size',
  icon_size: 'Icon size',
  badge_size: 'Badge size',
  chip_gap: 'Chip gap',
  locale: 'Locale (e.g. en-NZ)',
  tap_action: 'Tap behavior',
  hold_action: 'Hold behavior',
  double_tap_action: 'Double tap behavior'
}

@customElement('wheelie-bin-card-editor')
export class WheelieBinCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant
  @state() private config!: WheelieBinCardConfig
  @state() private openBin: string | null = null

  public setConfig (config: WheelieBinCardConfig): void {
    this.config = config
  }

  /** one row per bin the editor can switch on or off, enabled (ordered) ones first */
  private get binRows (): Array<{ bin: BinDefinition, enabled: boolean }> {
    if (!this.config) return []
    const enabled = effectiveBins(this.config)
    const have = new Set(enabled.map(binSlug))
    const pool = this.config.bins?.length ? this.config.bins : KNOWN_BINS
    const disabled = pool.filter((b) => !have.has(binSlug(b)))
    for (const k of KNOWN_BINS) {
      if (!have.has(binSlug(k)) && !disabled.some((b) => binSlug(b) === binSlug(k))) disabled.push(k)
    }
    return [
      ...enabled.map((bin) => ({ bin, enabled: true })),
      ...disabled.map((bin) => ({ bin: localizedBin(bin, this.config.labels), enabled: false }))
    ]
  }

  /** the full ordered bin list (enabled first, then the switched-off ones) */
  private fullRoster (): BinDefinition[] {
    const rows = this.binRows
    return [...rows.filter((r) => r.enabled), ...rows.filter((r) => !r.enabled)]
      .map((r) => ({ ...r.bin }))
  }

  /** bake the current on/off state into an explicit `bins` list so order can be saved */
  private materialize (): WheelieBinCardConfig {
    const roster = this.fullRoster()
    const enabledSlugs = new Set(effectiveBins(this.config).map(binSlug))
    const disabled = roster.map(binSlug).filter((s) => !enabledSlugs.has(s))
    const next: WheelieBinCardConfig = { ...this.config, bins: roster }
    if (disabled.length) next.disabled_bins = disabled
    else delete next.disabled_bins
    delete next.show_food_scraps
    return next
  }

  private get hasBinEdits (): boolean {
    return Boolean(
      this.config?.bins?.length ||
      this.config?.disabled_bins?.length ||
      this.config?.show_food_scraps
    )
  }

  private computeLabel = (schema: { name: string }): string => LABELS[schema.name] ?? schema.name

  protected render (): TemplateResult | typeof nothing {
    if (!this.hass || !this.config) return nothing
    const entity = this.config.entity
    const data = {
      show_badges: true,
      labels: 'english',
      ...this.config,
      // the entity selector is `multiple` — it wants an array
      entity: Array.isArray(entity) ? entity : entity ? [entity] : []
    }
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${SCHEMA}
        .computeLabel=${this.computeLabel}
        @value-changed=${this.formChanged}
      ></ha-form>

      <ha-expansion-panel outlined>
        <div slot="header" role="heading" aria-level="3" class="panel-header">
          <ha-svg-icon .path=${mdiTrashCan}></ha-svg-icon>
          <span>Bins</span>
        </div>
        <div class="panel-content">
          <ha-sortable handle-selector=".bin-drag" @item-moved=${this.binMoved}>
            <div class="bin-list">
              ${this.binRows.filter((r) => r.enabled).map(({ bin }) => this.renderBinRow(bin, true))}
            </div>
          </ha-sortable>
          ${this.binRows.filter((r) => !r.enabled).map(({ bin }) => this.renderBinRow(bin, false))}
          ${this.hasBinEdits
            ? html`<button class="link-btn" @click=${this.resetBins}>Reset bins to defaults</button>`
            : nothing}
          <p class="hint">
            Drag to reorder, or switch a bin off where there's no such collection
            (e.g. no glass in Auckland). Open a row to change its icon or colour;
            labels and match rules stay in the code editor —
            <a href="https://github.com/Greminn/wheelie-bin-card" target="_blank" rel="noreferrer">docs</a>.
          </p>
        </div>
      </ha-expansion-panel>
    `
  }

  private renderBinRow (bin: BinDefinition, enabled: boolean): TemplateResult {
    const slug = binSlug(bin)
    const open = enabled && this.openBin === slug
    return html`
      <div class=${classMap({ 'bin-row': true, off: !enabled, open })}>
        <div class="bin-head">
          ${enabled
            ? html`<div class="bin-drag" title="Drag to reorder">
                <ha-svg-icon .path=${mdiDrag}></ha-svg-icon>
              </div>`
            : html`<div class="bin-drag placeholder"></div>`}
          <ha-switch
            .checked=${enabled}
            @change=${(ev: Event) =>
              this.toggleBin(bin, (ev.target as HTMLInputElement).checked)}
          ></ha-switch>
          <button
            class="bin-summary"
            ?disabled=${!enabled}
            aria-expanded=${open}
            @click=${() => { this.openBin = open ? null : slug }}
          >
            <ha-icon class="bin-glyph" .icon=${bin.icon}></ha-icon>
            <span class="bin-name">${bin.label}</span>
            <span class="bin-dot" style=${`background:${swatchColor(bin.color)}`}></span>
            ${enabled
              ? html`<ha-svg-icon class="bin-caret" .path=${mdiChevronDown}></ha-svg-icon>`
              : nothing}
          </button>
        </div>
        ${open
          ? html`<div class="bin-detail">
              <ha-icon-picker
                .hass=${this.hass}
                .value=${bin.icon}
                .label=${'Icon'}
                @value-changed=${(ev: CustomEvent) => this.patchBin(bin, { icon: ev.detail.value })}
              ></ha-icon-picker>
              <ha-selector
                .hass=${this.hass}
                .selector=${{ ui_color: { include_state: true, default_color: 'state' } }}
                .value=${bin.color}
                .label=${'Colour'}
                @value-changed=${(ev: CustomEvent) => this.patchBin(bin, { color: ev.detail.value })}
              ></ha-selector>
            </div>`
          : nothing}
      </div>
    `
  }

  private formChanged = (ev: CustomEvent): void => {
    ev.stopPropagation()
    this.emit(ev.detail.value)
  }

  private patchBin (bin: BinDefinition, patch: Partial<BinDefinition>): void {
    const cfg = this.config.bins?.length ? this.config : this.materialize()
    const slug = binSlug(bin)
    const bins = (cfg.bins ?? []).map((b) => (binSlug(b) === slug ? { ...b, ...patch } : { ...b }))
    this.emit({ ...cfg, bins })
  }

  private binMoved = (ev: CustomEvent): void => {
    ev.stopPropagation()
    const { oldIndex, newIndex } = ev.detail as { oldIndex: number, newIndex: number }
    if (oldIndex === newIndex) return
    const cfg = this.config.bins?.length ? this.config : this.materialize()
    const off = new Set(cfg.disabled_bins ?? [])
    const on = (cfg.bins ?? []).filter((b) => !off.has(binSlug(b)))
    const rest = (cfg.bins ?? []).filter((b) => off.has(binSlug(b)))
    on.splice(newIndex, 0, on.splice(oldIndex, 1)[0])
    this.emit({ ...cfg, bins: [...on, ...rest] })
  }

  private toggleBin (bin: BinDefinition, enabled: boolean): void {
    const slug = binSlug(bin)
    const next = { ...this.config }

    // "Food scraps" is additive to the built-in set — ride its own flag unless
    // the bin list has been overridden, where it's just another entry
    if (slug === FOOD_SCRAPS_BIN.slug && !this.config.bins?.length) {
      if (enabled) next.show_food_scraps = true
      else delete next.show_food_scraps
    } else {
      const off = new Set(this.config.disabled_bins ?? [])
      if (enabled) off.delete(slug)
      else off.add(slug)
      if (off.size) next.disabled_bins = [...off]
      else delete next.disabled_bins
    }
    this.emit(next)
  }

  private resetBins = (): void => {
    const next = { ...this.config }
    delete next.bins
    delete next.disabled_bins
    delete next.show_food_scraps
    this.emit(next)
  }

  private emit (config: WheelieBinCardConfig): void {
    const clean = { ...config }
    // drop a stale nested key written by an earlier editor build
    delete (clean as Record<string, unknown>).toggles
    // 'english' is the default — no need to persist it
    if (clean.labels === 'english') delete clean.labels
    // keep a single sensor as a plain string
    if (Array.isArray(clean.entity) && clean.entity.length === 1) clean.entity = clean.entity[0]
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: clean },
      bubbles: true,
      composed: true
    }))
  }

  static styles = css`
    ha-expansion-panel {
      margin-top: 16px;
      display: block;
      --expansion-panel-content-padding: 0;
    }
    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    .panel-content {
      padding: 8px 16px 16px;
    }
    .bin-list {
      display: block;
    }
    .bin-row {
      padding: 4px 0;
      background: var(--ha-card-background, var(--card-background-color, #fff));
    }
    .bin-row + .bin-row {
      border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
    }
    .bin-head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .bin-head ha-switch {
      flex: 0 0 auto;
    }
    .bin-drag {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      color: var(--secondary-text-color);
      cursor: grab;
      touch-action: none;
      --mdc-icon-size: 20px;
    }
    .bin-drag.placeholder {
      width: 20px;
      cursor: default;
    }
    .bin-drag:active {
      cursor: grabbing;
    }
    .bin-summary {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      background: none;
      border: none;
      padding: 8px 0;
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }
    .bin-summary[disabled] {
      cursor: default;
      opacity: 0.6;
    }
    .bin-glyph {
      flex: 0 0 auto;
      color: var(--secondary-text-color);
      --mdc-icon-size: 20px;
    }
    .bin-name {
      flex: 1 1 auto;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bin-dot {
      flex: 0 0 auto;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(127, 127, 127, 0.35) inset;
    }
    .bin-caret {
      flex: 0 0 auto;
      color: var(--secondary-text-color);
      --mdc-icon-size: 20px;
      transition: transform 0.15s ease;
    }
    .bin-row.open .bin-caret {
      transform: rotate(180deg);
    }
    .bin-detail {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0 12px 40px;
      min-width: 0;
    }
    .link-btn {
      background: none;
      border: none;
      color: var(--primary-color);
      cursor: pointer;
      padding: 8px 0 0;
      font: inherit;
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 0.85rem;
      margin: 8px 0 0;
    }
    code {
      background: var(--secondary-background-color, rgba(150, 150, 150, 0.2));
      padding: 1px 4px;
      border-radius: 3px;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'wheelie-bin-card-editor': WheelieBinCardEditor
  }
}
