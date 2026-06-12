# Changelog

## 1.0.0

First stable public release. Validated in production for over one week.

### Components

- `custom:portail-card` — gate control (switch entity), custom SVG icons
- `custom:garage-switch-card` — garage door control (switch entity)
- `custom:garage-cover-card` — garage door control (cover entity)
- `custom:portail-badge` — observer-only pill badge with optional alert state

### Features

- **Custom SVG icons** for portail-card: gate-closed (blue), gate-open (green),
  gate-open-alert (grey = unavailable, red = open beyond threshold).
- **`alert_entity` for portail-badge** — optional binary sensor turns the badge
  red when the gate has been open too long.
- **Example package** (`examples/portail-package.yaml`) — ready-to-use HA
  template sensor and optional notification automation.
- **`getStubConfig(hass)`** — dynamic entity discovery for the visual card editor.
- **`offline_delay_minutes`** — configurable threshold (5-720 min) before the
  contact sensor triggers the offline/alert icon.
- **i18n fr/en** — labels adapt to the HA language setting.
- **Pill badges** with colour-coded state indicators.
- **Visual editor** (`getConfigForm`) for all four components.
- **HA 2026+ compatible** — uses `document.createElement` instead of the broken
  `customElements.get()`.

### Breaking changes from v0.4.0

None for existing card configurations. The `portail-badge` component and the
`alert_entity` field are new additions.

---

## 0.4.0

Initial HACS release. Basic gate/garage card with open/closed state and manual
control.

---

## Earlier

See [homeassistant-factory](https://git.famille-henrion.fr/NetRunner/homeassistant-factory)
for full development history.
