import { LitElement, css, html, nothing, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import { HomeAssistant, WheelieBinCardConfig, BinDefinition } from './types'
import { effectiveBins } from './defaults'

// MDI path data (avoids pulling in @mdi/js just for a few glyphs)
const mdiTextShort = 'M4,9H20V11H4V9M4,13H14V15H4V13'
const mdiGestureTap =
  'M10,9A1,1 0 0,1 11,8A1,1 0 0,1 12,9V13.47L13.21,13.6L18.15,15.79C18.68,16.03 19,16.56 19,17.14V21.5' +
  'C18.97,22.32 18.32,22.97 17.5,23H11C10.62,23 10.26,22.85 10,22.57L5.1,18.37L5.84,17.6C6.03,17.39 6.3,17.28 ' +
  '6.58,17.28H6.8L10,19V9M11,5A4,4 0 0,1 15,9C15,10.5 14.2,11.77 13,12.46V11.24C13.61,10.69 14,9.89 14,9A3,3 0 ' +
  '0,0 11,6A3,3 0 0,0 8,9C8,9.89 8.39,10.69 9,11.24V12.46C7.8,11.77 7,10.5 7,9A4,4 0 0,1 11,5Z'
const mdiTrashCan =
  'M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z'

const sizeSelector = { number: { min: 8, max: 120, mode: 'box', unit_of_measurement: 'px' } }

const SCHEMA = [
  { name: 'entity', required: true, selector: { entity: { domain: 'sensor' } } },
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
            mode: 'list',
            options: [
              { value: 'horizontal', label: 'Horizontal' },
              { value: 'vertical', label: 'Vertical' }
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
          { name: 'show_food_scraps', selector: { boolean: {} } },
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
  entity: 'Waste Collection Schedule sensor',
  content: 'Content',
  interactions: 'Interactions',
  title: 'Title',
  layout: 'Layout',
  show_badges: 'Badges (✓ / ✗)',
  show_food_scraps: 'Food scraps chip',
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

  public setConfig (config: WheelieBinCardConfig): void {
    this.config = config
  }

  private get bins (): BinDefinition[] {
    return this.config ? effectiveBins(this.config) : []
  }

  private computeLabel = (schema: { name: string }): string => LABELS[schema.name] ?? schema.name

  protected render (): TemplateResult | typeof nothing {
    if (!this.hass || !this.config) return nothing
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{ show_badges: true, ...this.config }}
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
          ${this.bins.map((bin, i) => html`
            <div class="bin-row">
              <span class="bin-name">${bin.label}</span>
              <div class="bin-fields">
                <ha-icon-picker
                  .hass=${this.hass}
                  .value=${bin.icon}
                  .label=${'Icon'}
                  @value-changed=${(ev: CustomEvent) => this.patchBin(i, { icon: ev.detail.value })}
                ></ha-icon-picker>
                <ha-selector
                  .hass=${this.hass}
                  .selector=${{ ui_color: { include_state: true, default_color: 'state' } }}
                  .value=${bin.color}
                  .label=${'Colour'}
                  @value-changed=${(ev: CustomEvent) => this.patchBin(i, { color: ev.detail.value })}
                ></ha-selector>
              </div>
            </div>
          `)}
          ${this.config.bins?.length
            ? html`<button class="link-btn" @click=${this.resetBins}>Reset bins to defaults</button>`
            : html`<p class="hint">
                Editing a bin's icon or colour saves the full bin list. Labels and
                match rules stay in the code editor —
                <a href="https://github.com/Greminn/wheelie-bin-card" target="_blank" rel="noreferrer">docs</a>.
              </p>`}
        </div>
      </ha-expansion-panel>
    `
  }

  private formChanged = (ev: CustomEvent): void => {
    ev.stopPropagation()
    this.emit(ev.detail.value)
  }

  private patchBin (index: number, patch: Partial<BinDefinition>): void {
    const bins = this.bins.map((b, i) => (i === index ? { ...b, ...patch } : { ...b }))
    this.emit({ ...this.config, bins })
  }

  private resetBins = (): void => {
    const next = { ...this.config }
    delete next.bins
    this.emit(next)
  }

  private emit (config: WheelieBinCardConfig): void {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config },
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
    .bin-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }
    .bin-row + .bin-row {
      border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
    }
    .bin-name {
      flex: 0 0 84px;
      font-weight: 500;
    }
    .bin-fields {
      flex: 1 1 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
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
