# Changelog - gate-card

## v0.5.0-beta.3 (2026-05-30)

### Added
- Custom SVG icons (512x512): gate-closed, gate-open, gate-open-alert
- PortailCard uses gate-closed (closed/blue), gate-open (open/green), gate-open-alert for both degraded states (unavailable/gray + open>30min/red)
- PortailBadge: inline SVG in Shadow DOM, no more ha-icon dependency
- Garage cards keep MDI icons (mdi:garage, mdi:garage-open)

---

## v0.5.0-beta.2 (2026-05-30)

### Fixed
- getStubConfig(hass): uses first available real entities for picker preview. Falls back to static stubs if no matching entity found. Fixes "Indisponible" preview in card picker when real entities exist.

---

## v0.5.0-beta.1 (2026-05-29)

### Added
- portail-badge: custom badge selectable from HA badge picker (window.customBadges), Shadow DOM, observe-only
- i18n fr/en: auto-detected from hass.locale.language, fallback fr
- State pill badge in card: styled chip (color-coded)

### Changed
- Unavailable/unknown contact_entity: distinct rendering ("Indisponible", gray)
- GATE_CARD_VERSION exposed in window.customCards[*].version

---

## v0.4.0 (2026-05-29)

### Changed
- Rename: gate-cards-v0.2.js -> gate-card.js (version in JS header, not in filename)
- Add GATE_CARD_VERSION constant
- HACS packaging: hacs.json, README, blueprint

---

## v0.2.0

- Add garage-cover-card (cover entity + contact sensor)
- Refactor to BaseGateCard class
- Offline sensor detection with blinking indicator (offline_delay_minutes)
- getConfigForm() for Lovelace visual editor

---

## v0.1.0

- portail-card: gate controlled by switch + contact sensor
- garage-switch-card: garage controlled by switch + contact sensor
