# Gate Card

Custom Lovelace cards for Home Assistant — gate and garage control with contact sensor supervision.

## Cards

| Card | Control entity | Use case |
|---|---|---|
| `portail-card` | `switch` | Gate/door controlled by a switch relay |
| `garage-switch-card` | `switch` | Garage door controlled by a switch relay |
| `garage-cover-card` | `cover` | Garage door controlled by a HA cover entity |

All cards require a `binary_sensor` contact sensor alongside the control entity.

## Installation via HACS

1. Go to **HACS > Frontend**
2. Click the three-dot menu > **Custom repositories**
3. Add `https://github.com/<user>/hacs-gate-card` — category **Lovelace**
4. Install **Gate Card**
5. Clear browser cache and reload Home Assistant

## Usage

```yaml
type: custom:portail-card
name: Portail Exterieur
switch_entity: switch.portail
contact_entity: binary_sensor.portail_contact
offline_delay_minutes: 60   # optional, default 60
```

```yaml
type: custom:garage-cover-card
name: Garage
cover_entity: cover.garage
contact_entity: binary_sensor.garage_contact
```

## Features

- Tap to toggle/open/close
- Visual feedback on tap (scale + shadow animation)
- Color-coded state: blue=closed, green=open, red=open >30 min
- Offline sensor indicator (blinking icon) when last seen exceeds delay
- Lovelace visual editor support (`getConfigForm`)

## Companion blueprint

An automation blueprint is available for open-too-long alerts:

`ha-config/blueprints/automation/gate-card/portail-alerte-ouverture.yaml`

Import it in **Settings > Automations > Blueprints > Import blueprint**.

## Version

Current: **0.4.0** — see [CHANGELOG.md](CHANGELOG.md)
