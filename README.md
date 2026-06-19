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
