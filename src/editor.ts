import { LitElement, css, html, nothing, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import { HomeAssistant, WheelieBinCardConfig } from './types'

const SCHEMA = [
  { name: 'entity', required: true, selector: { entity: { domain: 'sensor' } } },
  { name: 'title', selector: { text: {} } },
  {
    name: 'options',
    type: 'grid',
    schema: [
      { name: 'show_food_scraps', selector: { boolean: {} } },
      { name: 'hide_inactive', selector: { boolean: {} } },
      { name: 'show_labels', selector: { boolean: {} } }
    ]
  },
  { name: 'locale', selector: { text: {} } }
] as const

const LABELS: Record<string, string> = {
  entity: 'Waste Collection Schedule sensor (required)',
  title: 'Title',
  show_food_scraps: 'Show a Food scraps chip',
  hide_inactive: 'Hide bins not in the next collection',
  show_labels: 'Show a label under each chip',
  locale: 'Locale for day names (e.g. en-NZ)'
}

@customElement('wheelie-bin-card-editor')
export class WheelieBinCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant
  @state() private config!: WheelieBinCardConfig

  public setConfig (config: WheelieBinCardConfig): void {
    this.config = config
  }

  private computeLabel = (schema: { name: string }): string => LABELS[schema.name] ?? schema.name

  protected render (): TemplateResult | typeof nothing {
    if (!this.hass || !this.config) return nothing
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${SCHEMA}
        .computeLabel=${this.computeLabel}
        @value-changed=${this.valueChanged}
      ></ha-form>
      <p class="hint">
        A custom bin list (<code>bins:</code>) and <code>tap_action</code> are set
        in the code editor — see the
        <a href="https://github.com/Greminn/wheelie-bin-card" target="_blank" rel="noreferrer">docs</a>.
      </p>
    `
  }

  private valueChanged = (ev: CustomEvent): void => {
    ev.stopPropagation()
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: ev.detail.value },
      bubbles: true,
      composed: true
    }))
  }

  static styles = css`
    .hint {
      color: var(--secondary-text-color);
      font-size: 0.85rem;
      margin: 10px 4px 0;
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
