# Gate Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/NetRunner81FR/hacs-gate-card.svg)](https://github.com/NetRunner81FR/hacs-gate-card/releases)

Custom Lovelace cards and badge for Home Assistant gates and garage doors.

## Components

| Tag | Description |
|-----|-------------|
| `custom:portail-card` | Gate control card (switch entity) |
| `custom:garage-switch-card` | Garage door control (switch entity) |
| `custom:garage-cover-card` | Garage door control (cover entity) |
| `custom:portail-badge` | Observer-only gate state pill badge |

## Installation via HACS

1. HACS > Custom repositories > add this repository URL.
2. Select type **Plugin**.
3. Install **Gate Card**.
4. Clear browser cache if the previous version remains loaded.

After installation the resource is available at:

```text
/hacsfiles/gate-card/gate-card.js
```

## Cards

### portail-card

Control card for a gate driven by a switch entity.

```yaml
type: custom:portail-card
switch_entity: switch.portail     # required
contact_entity: binary_sensor.portail_ouverture  # required
name: Portail                     # optional
offline_delay_minutes: 30         # optional (5-720, default 60)
```

### garage-switch-card

Control card for a garage door driven by a switch entity.

```yaml
type: custom:garage-switch-card
switch_entity: switch.garage      # required
contact_entity: binary_sensor.garage_contact  # required
name: Garage                      # optional
offline_delay_minutes: 60         # optional
```

### garage-cover-card

Control card for a garage door driven by a cover entity.

```yaml
type: custom:garage-cover-card
cover_entity: cover.garage        # required
contact_entity: binary_sensor.garage_contact  # required
name: Garage                      # optional
offline_delay_minutes: 60         # optional
```

## Badge

### portail-badge

Observer-only pill badge. Does not control the gate — display only.
Use in the `badges:` section of your Lovelace view.

```yaml
type: custom:portail-badge
contact_entity: binary_sensor.portail_ouverture  # required
alert_entity: binary_sensor.alerte_portail_ouvert_30_min  # optional
name: Portail                     # optional (label prefix)
```

States displayed:

| State | Colour | Meaning |
|-------|--------|---------|
| Closed | Blue | Gate/garage is closed |
| Open | Green | Open, within normal time |
| Alert | Red | Open longer than threshold |
| Unavailable | Grey | Contact sensor not responding |

## Configuration fields

| Field | Required | Description |
|-------|----------|-------------|
| `switch_entity` | Yes (portail/garage-switch) | Switch that controls the gate |
| `cover_entity` | Yes (garage-cover) | Cover entity for the garage |
| `contact_entity` | Yes (all) | Binary sensor reporting open/closed |
| `name` | No | Display name |
| `offline_delay_minutes` | No | Minutes before contact sensor triggers alert (5-720) |
| `alert_entity` | No (badge only) | Binary sensor for long-open alert |

## Visual editor

All cards support the Lovelace visual editor (`getConfigForm`).
The editor auto-fills entities via `getStubConfig(hass)`.

## HA 2026+ compatibility

`customElements.get()` returns `undefined` due to `es-module-shims` wrapping.
To verify registration in E2E tests, use `document.createElement`:

```javascript
const el = document.createElement("portail-card");
const ok = el.constructor.name === "PortailCard"; // true if registered
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
