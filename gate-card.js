/**
 * gate-card — Custom Lovelace cards for gate/garage control and supervision
 *
 * Version  : 0.4.0
 * Author   : homeassistant-factory
 * License  : MIT
 * HACS     : Lovelace plugin — https://github.com/<user>/hacs-gate-card
 *
 * Cards provided:
 *   - portail-card        : gate controlled by switch + contact sensor
 *   - garage-switch-card  : garage controlled by switch + contact sensor
 *   - garage-cover-card   : garage controlled by cover + contact sensor
 *
 * Required props: switch_entity|cover_entity + contact_entity
 * Optional props: name, offline_delay_minutes (default 60)
 */

const GATE_CARD_VERSION = "0.4.0";

// Set true to display ls/lu/lc timestamps in card bottom-right for connection debugging
const GATE_CARD_DEBUG = false;


class BaseGateCard extends HTMLElement {
  setConfig(config) {
    const entityKey = this.constructor.entityKey;
    const prettyName = this.constructor.prettyMainLabel;

    if (!config[entityKey] || !config.contact_entity) {
      throw new Error(
        `${entityKey} (${prettyName}) et contact_entity sont obligatoires`
      );
    }

    this._config = config;
    this.innerHTML = "";
    this._card = undefined;
    this._pending = false;

    // délai alerte capteur non vu (minutes)
    const rawDelay = config.offline_delay_minutes;
    const parsed =
      typeof rawDelay === "number" ? rawDelay : parseFloat(rawDelay);
    this._offlineDelayMinutes = !isNaN(parsed) ? parsed : 60;

    // style global pour le badge clignotant (une seule fois)
    if (!BaseGateCard._styleInjected) {
    const style = document.createElement("style");
    style.textContent = `
        .gate-offline-indicator {
          animation: gate-offline-blink 0.8s infinite ease-in-out;
          transform-origin: center;
    }

    @keyframes gate-offline-blink {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.15;
        transform: scale(1.4);
      }
    }
    `;

    document.head.appendChild(style);
    BaseGateCard._styleInjected = true;
    }


  }

  set hass(hass) {
    this._hass = hass;
    if (!this._card) {
      this._createCard();
    }
    this._updateCard();
  }

  _createCard() {
    const card = document.createElement("ha-card");

    card.style.display = "grid";
    card.style.gridTemplateRows = "min-content min-content min-content";
    card.style.alignItems = "center";
    card.style.justifyItems = "center";
    card.style.padding = "6px 8px";
    card.style.rowGap = "1px";
    card.style.height = "100%";
    card.style.cursor = "pointer";
    card.style.boxSizing = "border-box";
    card.style.transition =
      "transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease, background 0.15s ease";
    card.style.position = "relative";

    // Titre
    const nameEl = document.createElement("div");
    nameEl.style.fontSize = "20px";
    nameEl.style.fontWeight = "700";
    nameEl.style.textAlign = "center";
    nameEl.style.lineHeight = "1";
    nameEl.style.margin = "0";
    this._nameEl = nameEl;
    card.appendChild(nameEl);

    // Icône centrale
    const icon = document.createElement("ha-icon");
    icon.style.setProperty("--mdc-icon-size", "clamp(40px, 8em, 120px)");
    icon.style.width = "var(--mdc-icon-size)";
    icon.style.height = "var(--mdc-icon-size)";
    icon.style.display = "block";
    icon.style.margin = "0";
    this._icon = icon;
    card.appendChild(icon);

    // État texte
    const stateEl = document.createElement("div");
    stateEl.style.fontSize = "15px";
    stateEl.style.opacity = "0.85";
    stateEl.style.lineHeight = "1.1";
    stateEl.style.margin = "0";
    this._stateEl = stateEl;
    card.appendChild(stateEl);

    // Badge "capteur non vu"
    const offlineIcon = document.createElement("ha-icon");
    offlineIcon.icon = "mdi:lan-disconnect";
    offlineIcon.style.setProperty("--mdc-icon-size", "20px");
    offlineIcon.style.width = "var(--mdc-icon-size)";
    offlineIcon.style.height = "var(--mdc-icon-size)";
    offlineIcon.style.position = "absolute";
    offlineIcon.style.top = "6px";
    offlineIcon.style.right = "10px";
    offlineIcon.style.display = "none";
    offlineIcon.style.color = "var(--error-color, #f44336)";
    offlineIcon.classList.add("gate-offline-indicator");
    this._offlineIcon = offlineIcon;
    card.appendChild(offlineIcon);

    // Petit texte de debug (ls= / lu= / lc=) en bas à droite
    if (GATE_CARD_DEBUG) {
      const debugEl = document.createElement("div");
      debugEl.style.position = "absolute";
      debugEl.style.right = "6px";
      debugEl.style.bottom = "4px";
      debugEl.style.fontSize = "9px";
      debugEl.style.opacity = "0.6";
      debugEl.style.pointerEvents = "none";  // pour ne pas gêner le clic
      this._debugLastSeenEl = debugEl;
      card.appendChild(debugEl);
    } else {
      this._debugLastSeenEl = null;
    }



    // clic = action
    card.addEventListener("click", () => this._handleClick());

    this._card = card;
    this.appendChild(card);
  }

  _updateCard() {
    if (!this._hass || !this._config || !this._card) return;

    const entityKey = this.constructor.entityKey;
    const controlId = this._config[entityKey];
    const controlEnt = this._hass.states[controlId];
    const contactEnt = this._hass.states[this._config.contact_entity];

    const defaultName = this.constructor.defaultName || "Portail";
    const name =
      this._config.name ||
      (controlEnt ? controlEnt.attributes.friendly_name : defaultName);
    this._nameEl.textContent = name;

    if (this._pending) return;

    // Durée d'ouverture (> 30 min)
    let openMinutes = null;
    if (contactEnt && contactEnt.state === "on" && contactEnt.last_changed) {
      const openedAt = new Date(contactEnt.last_changed).getTime();
      openMinutes = (Date.now() - openedAt) / 60000;
    }
    const isLongOpen = openMinutes !== null && openMinutes >= 30;

    const icons = this.constructor.icons || {
      closed: "mdi:gate",
      open: "mdi:gate-open",
    };

    // État + couleurs
    let etat = "État inconnu";
    let icon = icons.closed;
    let iconColor = "var(--primary-text-color)";
    let bgColor = "var(--card-background-color)";

    if (contactEnt) {
      const ouvert = contactEnt.state === "on";

      if (ouvert && isLongOpen) {
        etat = "❗Ouvert > 30 min";
        icon = icons.open;
        iconColor = "var(--error-color, #f44336)";
        bgColor = "rgba(244, 67, 54, 0.15)";
      } else {
        etat = ouvert ? "Ouvert" : "Fermé";
        icon = ouvert ? icons.open : icons.closed;

        iconColor = ouvert
          ? "var(--success-color, var(--state-ok-color, #00c853))"
          : "var(--primary-color)";

        bgColor = ouvert
          ? "rgba(76, 175, 80, 0.15)"
          : "rgba(33, 150, 243, 0.15)";
      }
    }

    this._icon.icon = icon;
    this._icon.style.color = iconColor;
    this._stateEl.textContent = etat;
    this._card.style.background = bgColor;

    // Badge "capteur non vu" + texte de debug ls/lu/lc
    if (this._offlineIcon && contactEnt) {

      let lastSeenStr = null;
      let sourceCode = "";

      // Déduction automatique du sensor <base>_last_seen
      const entId = this._config.contact_entity;  // ex: binary_sensor.ouverture_portail1_contact

      // base = ouverture_portail1
      const baseName = entId.replace("binary_sensor.", "").replace("_contact", "");

      // sensor.ouverture_portail1_last_seen
      const autoLastSeenEntity = `sensor.${baseName}_last_seen`;

      const deducedEnt = this._hass.states[autoLastSeenEntity];

      if (deducedEnt && deducedEnt.state && deducedEnt.state !== "unknown" && deducedEnt.state !== "unavailable") {
        lastSeenStr = deducedEnt.state;
        sourceCode = "ls";
      }

      // Fallback last_updated
      if (!lastSeenStr && contactEnt.last_updated) {
        lastSeenStr = contactEnt.last_updated;
        sourceCode = "lu";
      }

      // Dernier secours : last_changed
      if (!lastSeenStr && contactEnt.last_changed) {
        lastSeenStr = contactEnt.last_changed;
        sourceCode = "lc";
      }

      let showOffline = false;
      let debugText = "";

      if (lastSeenStr) {
        const lastMs = new Date(lastSeenStr).getTime();

        if (!Number.isNaN(lastMs)) {
          const diffMinutes = (Date.now() - lastMs) / 60000;

          if (diffMinutes >= this._offlineDelayMinutes) {
            showOffline = true;
          }

          const d = new Date(lastMs);
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");

          debugText = `${sourceCode}=${hh}:${mm}`;
        }
      }

      this._offlineIcon.style.display = showOffline ? "block" : "none";
      this._offlineIcon.style.animation = showOffline
        ? "gate-offline-blink 0.8s infinite ease-in-out"
        : "none";

     if (this._debugLastSeenEl) {
        this._debugLastSeenEl.textContent =
            GATE_CARD_DEBUG ? debugText : "";
    }

    }


}



  _handleClick() {
    if (this._pending) return;
    this._triggerCommand();
  }

  _triggerCommand() {
    if (!this._config || !this._hass) return;

    const entityKey = this.constructor.entityKey;
    const controlId = this._config[entityKey];
    const controlEnt = this._hass.states[controlId];
    const domain = this.constructor.controlDomain || "switch";
    const mode = this.constructor.controlMode || "switch";

    this._pending = true;

    // Anim / feedback
    this._stateEl.textContent = "⚡ Action enregistrée";
    this._card.style.transform = "scale(0.97)";
    this._card.style.boxShadow =
      "0 0 0 2px var(--primary-color, #2196f3), 0 4px 10px rgba(0,0,0,0.25)";

    // Commande
    if (mode === "switch") {
      this._hass.callService(domain, "toggle", {
        entity_id: controlId,
      });
    } else if (mode === "cover") {
      const st = controlEnt?.state;
      if (st === "open") {
        this._hass.callService(domain, "close_cover", {
          entity_id: controlId,
        });
      } else if (st === "closed") {
        this._hass.callService(domain, "open_cover", {
          entity_id: controlId,
        });
      } else {
        this._hass.callService(domain, "open_cover", {
          entity_id: controlId,
        });
      }
    }

    setTimeout(() => {
      this._pending = false;
      this._card.style.transform = "";
      this._card.style.boxShadow = "var(--ha-card-box-shadow, none)";
      this._updateCard();
    }, 500);
  }

  static getCardSize() {
    return 1;
  }
}

BaseGateCard._styleInjected = false;

//
// 1. Portail (switch + capteur) — icône portail
//
class PortailCard extends BaseGateCard {
  static get entityKey() {
    return "switch_entity";
  }
  static get controlDomain() {
    return "switch";
  }
  static get controlMode() {
    return "switch";
  }
  static get defaultName() {
    return "Portail";
  }
  static get icons() {
    return {
      closed: "mdi:gate",
      open: "mdi:gate-open",
    };
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "name",
          label: "Nom (optionnel)",
          selector: { text: {} },
        },
        {
          name: "switch_entity",
          label: "Entité switch (commande)",
          required: true,
          selector: {
            entity: {
              domain: "switch",
            },
          },
        },
        {
          name: "contact_entity",
          label: "Capteur d'ouverture",
          required: true,
          selector: {
            entity: { domain: "binary_sensor" },
          },
        },
        {
          name: "offline_delay_minutes",
          label: "Alerte capteur non vu (minutes)",
          selector: {
            number: {
              min: 5,
              max: 720,
              mode: "box",
            },
          },
        },
      ],
    };
  }


  static getStubConfig() {
    return {
      name: "Portail",
      switch_entity: "switch.portail",
      contact_entity: "binary_sensor.votre_contact",
    };
  }
}

//
// 2. Garage (switch + capteur) — icône garage, commande via switch
//
class GarageSwitchCard extends BaseGateCard {
  static get entityKey() {
    return "switch_entity";
  }
  static get controlDomain() {
    return "switch";
  }
  static get controlMode() {
    return "switch";
  }
  static get defaultName() {
    return "Garage";
  }
  static get icons() {
    return {
      closed: "mdi:garage",
      open: "mdi:garage-open",
    };
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "name",
          label: "Nom (optionnel)",
          selector: { text: {} },
        },
        {
          name: "switch_entity",
          label: "Entité switch (commande)",
          required: true,
          selector: {
            entity: {
              domain: "switch",
            },
          },
        },
        {
          name: "contact_entity",
          label: "Capteur d'ouverture",
          required: true,
          selector: {
            entity: { domain: "binary_sensor" },
          },
        },
        {
          name: "offline_delay_minutes",
          label: "Alerte capteur non vu (minutes)",
          selector: {
            number: {
              min: 5,
              max: 720,
              mode: "box",
            },
          },
        },
      ],
    };
  }


  static getStubConfig() {
    return {
      name: "Garage (switch)",
      switch_entity: "switch.garage",
      contact_entity: "binary_sensor.garage_contact",
    };
  }
}

//
// 3. Garage (cover + capteur) — icône garage, commande via cover
//
class GarageCoverCard extends BaseGateCard {
  static get entityKey() {
    return "cover_entity";
  }
  static get controlDomain() {
    return "cover";
  }
  static get controlMode() {
    return "cover";
  }
  static get defaultName() {
    return "Garage";
  }
  static get icons() {
    return {
      closed: "mdi:garage",
      open: "mdi:garage-open",
    };
  }

  static getConfigForm() {
  return {
    schema: [
      {
        name: "name",
        label: "Nom (optionnel)",
        selector: { text: {} },
      },
      {
        name: "cover_entity",
        label: "Cover du garage",
        required: true,
        selector: {
          entity: {
            domain: "cover",
          },
        },
      },
      {
        name: "contact_entity",
        label: "Capteur d'ouverture",
        required: true,
        selector: {
          entity: { domain: "binary_sensor" },
        },
      },
      {
        name: "offline_delay_minutes",
        label: "Alerte capteur non vu (minutes)",
        selector: {
          number: {
            min: 5,
            max: 720,
            mode: "box",
          },
        },
      },
    ],
  };
  }


  static getStubConfig() {
    return {
      name: "Garage (cover)",
      cover_entity: "cover.garage",
      contact_entity: "binary_sensor.garage_contact",
    };
  }
}

// Enregistrement des 3 cartes
customElements.define("portail-card", PortailCard);
customElements.define("garage-switch-card", GarageSwitchCard);
customElements.define("garage-cover-card", GarageCoverCard);

// Déclaration dans le picker Lovelace
window.customCards = window.customCards || [];
window.customCards.push({
  type: "portail-card",
  preview: true,
  name: "Portail (switch + capteur)",
  description: "Tuile portail avec commande et état d'ouverture.",
  version: GATE_CARD_VERSION,
});
window.customCards.push({
  type: "garage-switch-card",
  preview: true,
  name: "Garage (switch + capteur)",
  description: "Tuile garage pilotée par switch avec état d'ouverture.",
  version: GATE_CARD_VERSION,
});
window.customCards.push({
  type: "garage-cover-card",
  preview: true,
  name: "Garage (cover + capteur)",
  description: "Tuile garage pilotée par cover avec état d'ouverture.",
  version: GATE_CARD_VERSION,
});
