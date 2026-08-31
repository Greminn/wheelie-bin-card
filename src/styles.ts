import { css } from 'lit'

export default css`
  ha-card {
    display: block;
    padding: 12px 16px;
    height: 100%;
    box-sizing: border-box;
  }

  .wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 100%;
    flex-wrap: wrap;
  }

  .text {
    min-width: 0;
    flex: 1 1 auto;
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
    align-items: center;
    gap: 12px;
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
    width: var(--bcc-chip-size, 46px);
    height: var(--bcc-chip-size, 46px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bcc-chip-bg, rgba(150, 150, 150, 0.16));
    transition: background 0.2s ease;
  }

  .disc ha-icon {
    --mdc-icon-size: 24px;
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
    top: -3px;
    right: -3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--card-background-color, #1c1c1c);
    box-shadow: 0 0 0 2px var(--card-background-color, #1c1c1c);
  }

  .badge ha-icon {
    --mdc-icon-size: 14px;
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

  ha-card.clickable {
    cursor: pointer;
  }
`
