# Gate Card

Custom Lovelace card and badge for Home Assistant gates and garage doors.

## Installation via HACS

1. HACS > Custom repositories > add the GitHub repository URL.
2. Select type **Plugin**.
3. Install **Gate Card**.
4. Clear browser cache if the previous JavaScript version remains loaded.

## Resource

HACS should expose:

```text
/hacsfiles/gate-card/gate-card.js
```

## Card example

```yaml
type: custom:gate-card
entity: cover.gate
name: Gate
```

## Command entity

The service is chosen from the domain of the configured command entity:

| Domain | Service | Cards |
| --- | --- | --- |
| `switch` | `switch.toggle` | `portail-card`, `garage-switch-card` |
| `cover` | `cover.open_cover` / `cover.close_cover` (from current state) | `garage-cover-card` |
| `button` | `button.press` (single pulse) | all three cards |

Delta Dore Tydom exposes toggle-only gates and garage doors (for example TYXIA 4620)
as a `button` entity. Put that entity in the existing key, no migration needed:

```yaml
type: custom:garage-cover-card
name: Garage
cover_entity: button.garage
contact_entity: binary_sensor.garage_contact
```

Any other domain shows "Commande non supportée" and sends nothing. A tap is ignored
while a command is in progress (anti double pulse).
