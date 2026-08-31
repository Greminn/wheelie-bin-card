import { css } from 'lit'

export default css`
  :host {
    --bcc-chip-size: 44px;
    --bcc-icon-size: 24px;
    --bcc-chip-gap: 12px;
    --bcc-chip-bg: rgba(150, 150, 150, 0.16);
    --bcc-badge-size: max(15px, calc(var(--bcc-chip-size) * 0.4));
  }

  ha-card {
    display: block;
    padding: 12px 16px;
    box-sizing: border-box;
  }

  ha-card.clickable {
    cursor: pointer;
  }

  .wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .wrap.vertical {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .text {
    min-width: 0;
    flex: 1 1 auto;
  }

  .wrap.vertical .text {
    flex: 0 0 auto;
    text-align: center;
  }

  .title {
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--primary-text-color);
  }

  .summary {
    font-size: 0.95rem;
    line-height: 1.3;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  .chips {
    display: flex;
    align-items: flex-start;
    gap: var(--bcc-chip-gap);
    flex: 0 1 auto;
    flex-wrap: wrap;
    justify-content: flex-end;
    /* room so the last chip's badge is never clipped by the card edge */
    padding: 3px 3px 0 0;
  }

  .wrap.vertical .chips {
    justify-content: center;
    flex: 0 0 auto;
  }

  .chip {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .disc {
    position: relative;
    width: var(--bcc-chip-size);
    height: var(--bcc-chip-size);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bcc-chip-bg);
    transition: background 0.2s ease;
  }

  .disc ha-icon {
    --mdc-icon-size: var(--bcc-icon-size);
    color: var(--secondary-text-color);
    opacity: 0.55;
  }

  .chip.active .disc {
    background: var(--bcc-accent);
  }

  .chip.active .disc ha-icon {
    color: #fff;
    opacity: 1;
  }

  .badge {
    position: absolute;
    top: calc(var(--bcc-badge-size) * -0.35);
    right: calc(var(--bcc-badge-size) * -0.35);
    width: var(--bcc-badge-size);
    height: var(--bcc-badge-size);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--card-background-color, #1c1c1c);
    box-shadow: 0 0 0 2px var(--card-background-color, #1c1c1c);
  }

  .badge ha-icon {
    --mdc-icon-size: calc(var(--bcc-badge-size) * 0.78);
    color: var(--disabled-text-color, #9e9e9e);
  }

  .chip.active .badge {
    background: var(--bcc-accent);
  }

  .chip.active .badge ha-icon {
    color: #fff;
  }

  .label {
    font-size: 0.7rem;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }

  .chip:not(.active) .label {
    opacity: 0.6;
  }

  .error {
    color: var(--error-color, #db4437);
    font-size: 0.95rem;
  }
`
