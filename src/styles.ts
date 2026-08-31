import { css } from 'lit'

export default css`
  :host {
    --bcc-chip-size: 36px;
    --bcc-icon-size: 22px;
    --bcc-chip-gap: 10px;
    --bcc-chip-bg: rgba(150, 150, 150, 0.16);
    --bcc-badge-size: max(14px, calc(var(--bcc-chip-size) * 0.42));
  }

  ha-card {
    display: block;
    padding: 8px 14px;
    box-sizing: border-box;
    height: 100%;
    overflow: hidden;
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
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.25;
    color: var(--primary-text-color);
  }

  .summary {
    font-size: 0.9rem;
    line-height: 1.25;
    color: var(--secondary-text-color);
    margin-top: 1px;
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
    opacity: 0.5;
  }

  /* active — "faded" (default): faint colour disc, full-colour icon */
  .chip.active .disc {
    background: var(--bcc-accent-faded);
  }

  .chip.active .disc ha-icon {
    color: var(--bcc-accent);
    opacity: 1;
  }

  /* active — "filled": solid colour disc, white icon */
  .wrap.filled .chip.active .disc {
    background: var(--bcc-accent);
  }

  .wrap.filled .chip.active .disc ha-icon {
    color: #fff;
  }

  .badge {
    position: absolute;
    top: calc(var(--bcc-badge-size) * -0.32);
    right: calc(var(--bcc-badge-size) * -0.32);
    width: var(--bcc-badge-size);
    height: var(--bcc-badge-size);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bcc-badge-inactive, #9aa0a6);
  }

  .badge ha-icon {
    --mdc-icon-size: calc(var(--bcc-badge-size) * 0.92);
    color: #fff;
    --icon-primary-color: #fff;
  }

  .chip.active .badge {
    background: var(--bcc-accent);
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
