# Gate Card

Lovelace cards and a badge for Home Assistant gates and garage doors: one tap sends
the command, the tile shows the real open / closed state from a contact sensor.

| Type | Use | Command entity key |
| --- | --- | --- |
| `custom:portail-card` | Gate tile | `switch_entity` (`switch` or `button`) |
| `custom:garage-switch-card` | Garage tile driven by a switch | `switch_entity` (`switch` or `button`) |
| `custom:garage-cover-card` | Garage tile driven by a cover | `cover_entity` (`cover` or `button`) |
| `custom:portail-badge` | Compact read-only state badge | none (never sends a command) |

## Installation (HACS)

1. HACS > Custom repositories > add `https://github.com/NetRunner81FR/hacs-gate-card`,
   type **Plugin**.
2. Install **Gate Card**, then reload the browser (clear the cache if the old version stays loaded).
3. HACS registers the resource `/hacsfiles/gate-card/gate-card.js` (type `module`).

All cards and the badge are available in the UI card / badge picker with a visual editor.

## Cards

```yaml
type: custom:portail-card
name: Front gate
switch_entity: switch.front_gate
contact_entity: binary_sensor.front_gate_contact
```

```yaml
type: custom:garage-cover-card
name: Garage
cover_entity: cover.garage            # or button.garage
contact_entity: binary_sensor.garage_contact
```

`garage-switch-card` takes the same options as `portail-card` with a garage icon.

| Option | Required | Default | Description |
| --- | --- | --- | --- |
| `switch_entity` / `cover_entity` | yes | - | Command entity (key depends on the card type, see above) |
| `contact_entity` | yes | - | `binary_sensor` giving the state (`on` = open) |
| `name` | no | entity friendly name | Tile title |
| `visual_threshold_minutes` | no | `30` | Open longer than this: red tile, "Open > X min" |
| `offline_delay_minutes` | no | `60` | Sensor not seen for this long: blinking disconnect icon |

## Command

The service depends on the domain of the command entity:

| Domain | Service sent on tap |
| --- | --- |
| `switch` | `switch.toggle` |
| `cover` | `cover.close_cover` if open, else `cover.open_cover` |
| `button` | `button.press` (single pulse) |

Delta Dore Tydom exposes toggle-only gates and garage doors (for example TYXIA 4620) as a
`button` entity: put it in the existing key, no other change needed.

- A domain not accepted by the card shows "Unsupported command" and sends nothing.
- A tap is ignored while a command is in progress (lock of at least 500 ms, anti double pulse).
- A failed service call shows "Command failed" for 3 s.

## State display

| Contact sensor | Tile |
| --- | --- |
| `off` | Closed (blue) |
| `on` | Open (green) |
| `on` for more than `visual_threshold_minutes` | Open > X min (red) |
| missing, `unknown` or `unavailable` | Unavailable (grey) |

The tile state comes from `contact_entity` only. If the sensor has a companion
`sensor.<name>_last_seen` (Zigbee2MQTT), it is used for the offline icon; otherwise
the contact's `last_updated` is used.

Labels follow the Home Assistant language: French or English (French by default).

## Badge

```yaml
type: custom:portail-badge
name: Gate
contact_entity: binary_sensor.front_gate_contact
alert_entity: binary_sensor.front_gate_open_too_long   # optional
```

Shows `<name> - Open / Closed / Unavail.`; when the optional `alert_entity` is `on`,
it shows the long-open alert in red. The badge never calls a service.

## Optional package

[`examples/portail-package-example.yaml`](examples/portail-package-example.yaml) adds
global thresholds (`input_number`), alert binary sensors usable as the badge
`alert_entity`, and "open too long" notification automations. Adapt the entity ids.
The cards work without it.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
