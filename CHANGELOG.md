# Changelog — gate-card

## v0.4.0 (2026-05-29)

### Changed
- Rename: gate-cards-v0.2.js -> gate-card.js (version in JS header, not in filename)
- Add GATE_CARD_VERSION constant exposed via window.customCards[*].version
- HACS packaging: hacs.json, README
- Companion automation blueprint: portail-alerte-ouverture.yaml
- Lovelace resource now declared in configuration.yaml

### Note
No functional changes from v0.2. Transparent upgrade.

---

## v0.2.0

- Add garage-cover-card (cover entity + contact sensor)
- Refactor to BaseGateCard class
- Offline sensor detection with blinking indicator (offline_delay_minutes)
- Debug mode GATE_CARD_DEBUG (ls/lu/lc timestamps)
- getConfigForm() for Lovelace visual editor

---

## v0.1.0

- portail-card: gate controlled by switch + contact sensor
- garage-switch-card: garage controlled by switch + contact sensor
