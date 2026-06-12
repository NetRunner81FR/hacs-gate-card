# Changelog

## 0.5.0 (stable)

First stable release. Validated in production for over one week (beta.3 since 2026-06-01).

### New cards

- **`portail-badge`** — observer-only pill badge for gates.
  Shows open/closed/unavailable state. Accepts an optional `alert_entity` to
  display a red alert when the gate has been open too long.

### Improvements to existing cards

- **Custom SVG icons** for `portail-card`: `gate-closed` (blue), `gate-open` (green),
  `gate-open-alert` (grey when unavailable, red when open > threshold).
- **`getStubConfig(hass)`** — dynamic entity discovery: the visual card editor
  auto-fills the most relevant entities found in your Home Assistant instance.
- **`offline_delay_minutes`** — configurable threshold (5–720 min) before an
  unresponsive contact sensor triggers the alert icon.
- **i18n fr/en** — labels adapt to your Home Assistant language setting.
- **Pill badges** — compact state indicators with color coding.

### Bug fixes

- `customElements.get()` broken by `es-module-shims` in HA 2026+:
  element registration now verified via `document.createElement` + constructor check.
- `hacs.json`: `content_in_root` + `filename` both required together.
- Garage cover card: offline indicator displayed correctly when cover entity
  is unavailable (Tydom mock scenario).

### Components registered

| Tag | Type | Use |
|-----|------|-----|
| `portail-card` | card | Gate control (switch entity) |
| `garage-switch-card` | card | Garage door control (switch entity) |
| `garage-cover-card` | card | Garage door control (cover entity) |
| `portail-badge` | badge | Observer-only gate state pill |

---

## 0.4.0

- Initial HACS release. Basic gate/garage card with open/closed state and manual control.

---

## Earlier

See [homeassistant-factory](https://git.famille-henrion.fr/NetRunner/homeassistant-factory)
for full development history.
