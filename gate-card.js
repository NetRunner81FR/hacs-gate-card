// gate-card.js — Cartes et badge Lovelace pour portails / garages
const GATE_CARD_VERSION = "0.5.0";

// Debug : afficher ls/lu/lc (last seen / last update / last changed) en bas a droite
const GATE_CARD_DEBUG = false;

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
const LABELS = {
  fr: {
    open:        "Ouvert",
    closed:      "Fermé",
    unavailable: "Indisponible",
    longOpen:    "❗Ouvert > 30 min",
    action:      "⚡ Action enregistrée",
    badgeOpen:       "Ouvert",
    badgeClosed:     "Fermé",
    badgeLongOpen:   "Ouvert +30 min",
    badgeUnavail:    "Indispo",
  },
  en: {
    open:        "Open",
    closed:      "Closed",
    unavailable: "Unavailable",
    longOpen:    "❗Open > 30 min",
    action:      "⚡ Action triggered",
    badgeOpen:       "Open",
    badgeClosed:     "Closed",
    badgeLongOpen:   "Open > 30 min",
    badgeUnavail:    "Unavail.",
  },
};

function getLabels(hass) {
  const lang = (hass?.locale?.language || "fr").slice(0, 2).toLowerCase();
  return LABELS[lang] || LABELS.fr;
}

// ---------------------------------------------------------------------------
// Icones SVG custom portail — viewBox 0 0 512 512
// ---------------------------------------------------------------------------
const GATE_SVG_PATHS = {
  "gate-closed":
    "M48 120a24 24 0 1 1 0 48a24 24 0 0 1 0-48m416 0a24 24 0 1 1 0 48a24 24 0 0 1 0-48" +
    "M24 184h48v304H24V184m416 0h48v304h-48V184" +
    "M88 216c44 0 92-80 160-80h16c68 0 116 80 160 80h8v16h-8v256h-16V226c-5-2-10-5-16-8v270" +
    "h-16V209c-5-3-11-7-16-11v290h-16V186c-5-4-11-8-16-12v314h-16V163c-5-3-11-7-16-10v335" +
    "h-16V144c-5-2-11-4-16-5v349h-16V139c-5 1-11 3-16 5v344h-16V153c-5 3-11 7-16 10v325" +
    "h-16V174c-5 4-11 8-16 12v302h-16V198c-5 4-11 8-16 11v279h-16V218c-6 3-11 6-16 8v262" +
    "H88V232h-8v-16h8M216 312h80v32h-80v-32m0 48h16v128h-16V360m32 0h16v128h-16V360m32 0h16v128h-16V360Z",

  "gate-open":
    "M48 120a24 24 0 1 1 0 48a24 24 0 0 1 0-48m416 0a24 24 0 1 1 0 48a24 24 0 0 1 0-48" +
    "M24 184h48v304H24V184m416 0h48v304h-48V184" +
    "M88 232c42-8 88-54 160-96v352h-16V168c-6 4-11 8-16 12v308h-16V192c-6 4-11 8-16 12v284" +
    "h-16V216c-6 4-11 7-16 10v262h-16V237c-6 3-11 5-16 7v244h-16V249c-6 1-11 2-16 2V232" +
    "m336 0v19c-5 0-10-1-16-2v239h-16V244c-5-2-10-4-16-7v251h-16V226c-5-3-10-6-16-10v272" +
    "h-16V204c-5-4-10-8-16-12v296h-16V180c-5-4-10-8-16-12v320h-16V136c72 42 118 88 160 96" +
    "M136 328h96v32h-96v-32m144 0h96v32h-96v-32Z",

  "gate-open-alert":
    "M48 120a24 24 0 1 1 0 48a24 24 0 0 1 0-48m416 0a24 24 0 1 1 0 48a24 24 0 0 1 0-48" +
    "M24 184h48v304H24V184m416 0h48v192h-48V184" +
    "M88 232c42-8 88-54 160-96v352h-16V168c-6 4-11 8-16 12v308h-16V192c-6 4-11 8-16 12v284" +
    "h-16V216c-6 4-11 7-16 10v262h-16V237c-6 3-11 5-16 7v244h-16V249c-6 1-11 2-16 2V232" +
    "m336 0v19c-5 0-10-1-16-2v127h-16V244c-5-2-10-4-16-7v139h-16V226c-5-3-10-6-16-10v160" +
    "h-16V204c-5-4-10-8-16-12v184h-16V180c-5-4-10-8-16-12v320h-16V136c72 42 118 88 160 96" +
    "M136 328h96v32h-96v-32" +
    "m248 32a80 80 0 1 1 0 160a80 80 0 0 1 0-160m-12 32v72h24v-72h-24m0 88v24h24v-24h-24Z",
};

// Cherche la premiere entite disponible d'un domaine pour le stub du picker.
function _stubFirst(hass, domain, keywords) {
  if (!hass?.states) return null;
  const ids = Object.keys(hass.states).filter(id => id.startsWith(`${domain}.`));
  if (keywords?.length) {
    const hit = ids.find(id => keywords.some(k => id.includes(k)));
    if (hit) return hit;
  }
  return ids[0] || null;
}

// ---------------------------------------------------------------------------
// BaseGateCard — classe de base commune aux 3 cartes
// ---------------------------------------------------------------------------
class BaseGateCard extends HTMLElement {
  setConfig(config) {
    const entityKey   = this.constructor.entityKey;
    const prettyName  = this.constructor.prettyMainLabel || entityKey;

    if (!config[entityKey] || !config.contact_entity) {
      throw new Error(
        `${entityKey} (${prettyName}) et contact_entity sont obligatoires`
      );
    }

    this._config  = config;
    this.innerHTML = "";
    this._card    = undefined;
    this._pending = false;

    const rawDelay = config.offline_delay_minutes;
    const parsed   = typeof rawDelay === "number" ? rawDelay : parseFloat(rawDelay);
    this._offlineDelayMinutes = !isNaN(parsed) ? parsed : 60;

    if (!BaseGateCard._styleInjected) {
      const style = document.createElement("style");
      style.textContent = `
        .gate-offline-indicator {
          animation: gate-offline-blink 0.8s infinite ease-in-out;
          transform-origin: center;
        }
        @keyframes gate-offline-blink {
          0%, 100% { opacity: 1;    transform: scale(1);   }
          50%       { opacity: 0.15; transform: scale(1.4); }
        }
      `;
      document.head.appendChild(style);
      BaseGateCard._styleInjected = true;
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._card) this._createCard();
    this._updateCard();
  }

  _createCard() {
    const card = document.createElement("ha-card");
    card.style.cssText = `
      display: grid;
      grid-template-rows: min-content min-content min-content;
      align-items: center;
      justify-items: center;
      padding: 6px 8px;
      row-gap: 1px;
      height: 100%;
      cursor: pointer;
      box-sizing: border-box;
      transition: transform 0.15s ease, filter 0.15s ease,
                  box-shadow 0.15s ease, background 0.15s ease;
      position: relative;
    `;

    // Titre
    const nameEl = document.createElement("div");
    nameEl.style.cssText = "font-size:20px;font-weight:700;text-align:center;line-height:1;margin:0;";
    this._nameEl = nameEl;
    card.appendChild(nameEl);

    // Icone centrale — div conteneur (SVG custom ou ha-icon MDI selon le type de carte)
    const icon = document.createElement("div");
    icon.style.cssText = "display:block;margin:0;width:clamp(40px,8em,120px);height:clamp(40px,8em,120px);flex-shrink:0;";
    this._icon = icon;
    card.appendChild(icon);

    // Badge pill d'etat (Phase 3b)
    const stateEl = document.createElement("div");
    stateEl.style.cssText = `
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
      padding: 3px 12px;
      border-radius: 14px;
      line-height: 1.5;
      margin: 4px 0 0;
      display: inline-block;
      transition: background 0.2s ease, color 0.2s ease;
    `;
    this._stateEl = stateEl;
    card.appendChild(stateEl);

    // Badge "capteur non vu"
    const offlineIcon = document.createElement("ha-icon");
    offlineIcon.icon = "mdi:lan-disconnect";
    offlineIcon.style.setProperty("--mdc-icon-size", "20px");
    offlineIcon.style.width    = "var(--mdc-icon-size)";
    offlineIcon.style.height   = "var(--mdc-icon-size)";
    offlineIcon.style.position = "absolute";
    offlineIcon.style.top      = "6px";
    offlineIcon.style.right    = "10px";
    offlineIcon.style.display  = "none";
    offlineIcon.style.color    = "var(--error-color, #f44336)";
    offlineIcon.classList.add("gate-offline-indicator");
    this._offlineIcon = offlineIcon;
    card.appendChild(offlineIcon);

    // Debug (ls= / lu= / lc=)
    if (GATE_CARD_DEBUG) {
      const debugEl = document.createElement("div");
      debugEl.style.cssText = "position:absolute;right:6px;bottom:4px;font-size:9px;opacity:0.6;pointer-events:none;";
      this._debugLastSeenEl = debugEl;
      card.appendChild(debugEl);
    } else {
      this._debugLastSeenEl = null;
    }

    card.addEventListener("click", () => this._handleClick());
    this._card = card;
    this.appendChild(card);
  }

  // Rendu de l'icone : SVG inline pour les icones custom, ha-icon pour MDI.
  _setIconContent(iconKey, color) {
    const svgPath = GATE_SVG_PATHS[iconKey];
    if (svgPath) {
      this._icon.innerHTML =
        `<svg viewBox="0 0 512 512" style="width:100%;height:100%;display:block;" xmlns="http://www.w3.org/2000/svg">` +
        `<path fill="${color}" d="${svgPath}"/></svg>`;
    } else {
      // ha-icon MDI (lazy init)
      if (!this._icon._haIcon) {
        this._icon.innerHTML = "";
        const haIcon = document.createElement("ha-icon");
        haIcon.style.setProperty("--mdc-icon-size", "clamp(40px,8em,120px)");
        haIcon.style.cssText += "width:var(--mdc-icon-size);height:var(--mdc-icon-size);display:block;";
        this._icon._haIcon = haIcon;
        this._icon.appendChild(haIcon);
      }
      this._icon._haIcon.icon  = iconKey;
      this._icon._haIcon.style.color = color;
    }
  }

  _updateCard() {
    if (!this._hass || !this._config || !this._card) return;

    const labels     = getLabels(this._hass);
    const entityKey  = this.constructor.entityKey;
    const controlId  = this._config[entityKey];
    const controlEnt = this._hass.states[controlId];
    const contactEnt = this._hass.states[this._config.contact_entity];

    const defaultName = this.constructor.defaultName || "Portail";
    const name =
      this._config.name ||
      (controlEnt ? controlEnt.attributes.friendly_name : defaultName);
    this._nameEl.textContent = name;

    if (this._pending) return;

    // --- etat unavailable / unknown (Phase 3a) ---
    const isUnavailable =
      !contactEnt ||
      contactEnt.state === "unavailable" ||
      contactEnt.state === "unknown";

    const icons = this.constructor.icons || { closed: "mdi:gate", open: "mdi:gate-open", alert: "mdi:gate-open" };

    if (isUnavailable) {
      const unavailColor = "var(--disabled-color, #9e9e9e)";
      this._setIconContent(icons.alert || icons.open, unavailColor);
      this._card.style.background    = "rgba(158, 158, 158, 0.08)";
      this._stateEl.textContent      = labels.unavailable;
      this._stateEl.style.background = "rgba(158, 158, 158, 0.18)";
      this._stateEl.style.color      = unavailColor;
      if (this._offlineIcon) this._offlineIcon.style.display = "none";
      if (this._debugLastSeenEl) this._debugLastSeenEl.textContent = "";
      return;
    }

    // --- calcul duree d'ouverture ---
    let openMinutes = null;
    if (contactEnt.state === "on" && contactEnt.last_changed) {
      openMinutes = (Date.now() - new Date(contactEnt.last_changed).getTime()) / 60000;
    }
    const isLongOpen = openMinutes !== null && openMinutes >= 30;

    let etat, iconKey, iconColor, bgColor, pillBg, pillColor;

    if (contactEnt.state === "on" && isLongOpen) {
      etat      = labels.longOpen;
      iconKey   = icons.alert || icons.open;
      iconColor = "var(--error-color, #f44336)";
      bgColor   = "rgba(244, 67, 54, 0.15)";
      pillBg    = "rgba(244, 67, 54, 0.22)";
      pillColor = "var(--error-color, #f44336)";
    } else if (contactEnt.state === "on") {
      etat      = labels.open;
      iconKey   = icons.open;
      iconColor = "var(--success-color, var(--state-ok-color, #00c853))";
      bgColor   = "rgba(76, 175, 80, 0.15)";
      pillBg    = "rgba(76, 175, 80, 0.22)";
      pillColor = "var(--success-color, #00c853)";
    } else {
      etat      = labels.closed;
      iconKey   = icons.closed;
      iconColor = "var(--primary-color, #2196f3)";
      bgColor   = "rgba(33, 150, 243, 0.15)";
      pillBg    = "rgba(33, 150, 243, 0.22)";
      pillColor = "var(--primary-color, #2196f3)";
    }

    this._setIconContent(iconKey, iconColor);
    this._card.style.background    = bgColor;
    this._stateEl.textContent      = etat;
    this._stateEl.style.background = pillBg;
    this._stateEl.style.color      = pillColor;

    // --- badge capteur non vu ---
    this._updateOfflineIndicator(contactEnt);
  }

  _updateOfflineIndicator(contactEnt) {
    if (!this._offlineIcon) return;

    const entId       = this._config.contact_entity;
    const baseName    = entId.replace("binary_sensor.", "").replace("_contact", "");
    const autoLsId    = `sensor.${baseName}_last_seen`;
    const deducedEnt  = this._hass.states[autoLsId];

    let lastSeenStr = null;
    let sourceCode  = "";

    if (
      deducedEnt &&
      deducedEnt.state &&
      deducedEnt.state !== "unknown" &&
      deducedEnt.state !== "unavailable"
    ) {
      lastSeenStr = deducedEnt.state;
      sourceCode  = "ls";
    } else if (contactEnt.last_updated) {
      lastSeenStr = contactEnt.last_updated;
      sourceCode  = "lu";
    } else if (contactEnt.last_changed) {
      lastSeenStr = contactEnt.last_changed;
      sourceCode  = "lc";
    }

    let showOffline = false;
    let debugText   = "";

    if (lastSeenStr) {
      const lastMs = new Date(lastSeenStr).getTime();
      if (!Number.isNaN(lastMs)) {
        const diffMinutes = (Date.now() - lastMs) / 60000;
        if (diffMinutes >= this._offlineDelayMinutes) showOffline = true;
        const d  = new Date(lastMs);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        debugText = `${sourceCode}=${hh}:${mm}`;
      }
    }

    this._offlineIcon.style.display   = showOffline ? "block" : "none";
    this._offlineIcon.style.animation = showOffline
      ? "gate-offline-blink 0.8s infinite ease-in-out"
      : "none";

    if (this._debugLastSeenEl) {
      this._debugLastSeenEl.textContent = GATE_CARD_DEBUG ? debugText : "";
    }
  }

  _handleClick() {
    if (this._pending) return;
    this._triggerCommand();
  }

  _triggerCommand() {
    if (!this._config || !this._hass) return;
    const labels     = getLabels(this._hass);
    const entityKey  = this.constructor.entityKey;
    const controlId  = this._config[entityKey];
    const controlEnt = this._hass.states[controlId];
    const domain     = this.constructor.controlDomain || "switch";
    const mode       = this.constructor.controlMode   || "switch";

    this._pending = true;
    this._stateEl.textContent      = labels.action;
    this._stateEl.style.background = "rgba(33, 150, 243, 0.18)";
    this._stateEl.style.color      = "var(--primary-color, #2196f3)";
    this._card.style.transform     = "scale(0.97)";
    this._card.style.boxShadow     =
      "0 0 0 2px var(--primary-color, #2196f3), 0 4px 10px rgba(0,0,0,0.25)";

    if (mode === "switch") {
      this._hass.callService(domain, "toggle", { entity_id: controlId });
    } else if (mode === "cover") {
      const st = controlEnt?.state;
      const svc = st === "open" ? "close_cover" : "open_cover";
      this._hass.callService(domain, svc, { entity_id: controlId });
    }

    setTimeout(() => {
      this._pending = false;
      this._card.style.transform = "";
      this._card.style.boxShadow = "var(--ha-card-box-shadow, none)";
      this._updateCard();
    }, 500);
  }

  static getCardSize() { return 1; }
}

BaseGateCard._styleInjected = false;

// ---------------------------------------------------------------------------
// 1. Portail (switch + capteur)
// ---------------------------------------------------------------------------
class PortailCard extends BaseGateCard {
  static get entityKey()       { return "switch_entity"; }
  static get controlDomain()   { return "switch"; }
  static get controlMode()     { return "switch"; }
  static get defaultName()     { return "Portail"; }
  static get prettyMainLabel() { return "switch portail"; }
  static get icons()           { return { closed: "gate-closed", open: "gate-open", alert: "gate-open-alert" }; }

  static getConfigForm() {
    return {
      schema: [
        { name: "name",           label: "Nom (optionnel)",               selector: { text: {} } },
        { name: "switch_entity",  label: "Entité switch (commande)",      required: true,  selector: { entity: { domain: "switch" } } },
        { name: "contact_entity", label: "Capteur d'ouverture",           required: true,  selector: { entity: { domain: "binary_sensor" } } },
        { name: "offline_delay_minutes", label: "Alerte capteur non vu (minutes)", selector: { number: { min: 5, max: 720, mode: "box" } } },
      ],
    };
  }

  static getStubConfig(hass) {
    return {
      name: "Portail",
      switch_entity:  _stubFirst(hass, "switch",  ["portail", "gate"])   || "switch.portail",
      contact_entity: _stubFirst(hass, "binary_sensor", ["portail", "ouverture", "contact"]) || "binary_sensor.votre_contact",
    };
  }
}

// ---------------------------------------------------------------------------
// 2. Garage (switch + capteur)
// ---------------------------------------------------------------------------
class GarageSwitchCard extends BaseGateCard {
  static get entityKey()       { return "switch_entity"; }
  static get controlDomain()   { return "switch"; }
  static get controlMode()     { return "switch"; }
  static get defaultName()     { return "Garage"; }
  static get prettyMainLabel() { return "switch garage"; }
  static get icons()           { return { closed: "mdi:garage", open: "mdi:garage-open", alert: "mdi:garage-open" }; }

  static getConfigForm() {
    return {
      schema: [
        { name: "name",           label: "Nom (optionnel)",               selector: { text: {} } },
        { name: "switch_entity",  label: "Entité switch (commande)",      required: true,  selector: { entity: { domain: "switch" } } },
        { name: "contact_entity", label: "Capteur d'ouverture",           required: true,  selector: { entity: { domain: "binary_sensor" } } },
        { name: "offline_delay_minutes", label: "Alerte capteur non vu (minutes)", selector: { number: { min: 5, max: 720, mode: "box" } } },
      ],
    };
  }

  static getStubConfig(hass) {
    return {
      name: "Garage (switch)",
      switch_entity:  _stubFirst(hass, "switch",  ["garage"])   || "switch.garage",
      contact_entity: _stubFirst(hass, "binary_sensor", ["garage", "contact"]) || "binary_sensor.garage_contact",
    };
  }
}

// ---------------------------------------------------------------------------
// 3. Garage (cover + capteur)
// ---------------------------------------------------------------------------
class GarageCoverCard extends BaseGateCard {
  static get entityKey()       { return "cover_entity"; }
  static get controlDomain()   { return "cover"; }
  static get controlMode()     { return "cover"; }
  static get defaultName()     { return "Garage"; }
  static get prettyMainLabel() { return "cover garage"; }
  static get icons()           { return { closed: "mdi:garage", open: "mdi:garage-open", alert: "mdi:garage-open" }; }

  static getConfigForm() {
    return {
      schema: [
        { name: "name",           label: "Nom (optionnel)",               selector: { text: {} } },
        { name: "cover_entity",   label: "Cover du garage",               required: true,  selector: { entity: { domain: "cover" } } },
        { name: "contact_entity", label: "Capteur d'ouverture",           required: true,  selector: { entity: { domain: "binary_sensor" } } },
        { name: "offline_delay_minutes", label: "Alerte capteur non vu (minutes)", selector: { number: { min: 5, max: 720, mode: "box" } } },
      ],
    };
  }

  static getStubConfig(hass) {
    return {
      name: "Garage (cover)",
      cover_entity:   _stubFirst(hass, "cover",   ["garage"])   || "cover.garage",
      contact_entity: _stubFirst(hass, "binary_sensor", ["garage", "contact"]) || "binary_sensor.garage_contact",
    };
  }
}

// ---------------------------------------------------------------------------
// 4. PortailBadge — badge compact selectionnable dans le picker HA
//    Observe-only : aucun callService. Shadow DOM pour CSS encapsulee.
// ---------------------------------------------------------------------------
class PortailBadge extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host { display: inline-flex; }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px 4px 8px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          line-height: 1.4;
          cursor: default;
          min-width: 70px;
          justify-content: center;
          transition: background 0.2s ease, color 0.2s ease;
          background: rgba(158, 158, 158, 0.15);
          color: var(--secondary-text-color, #9e9e9e);
        }
        .icon-wrap { width: 15px; height: 15px; flex-shrink: 0; display: flex; align-items: center; }
        .icon-wrap svg { width: 100%; height: 100%; display: block; }
      </style>
      <div class="badge" part="badge">
        <span class="icon-wrap"></span>
        <span class="label"></span>
      </div>
    `;
    this._badgeEl = shadow.querySelector(".badge");
    this._iconEl  = shadow.querySelector(".icon-wrap");
    this._labelEl = shadow.querySelector(".label");
  }

  setConfig(config) {
    if (!config.contact_entity) {
      throw new Error("portail-badge : contact_entity est obligatoire");
    }
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  _update() {
    if (!this._config || !this._hass) return;

    const labels     = getLabels(this._hass);
    const contactEnt = this._hass.states[this._config.contact_entity];
    const alertEnt   = this._config.alert_entity
      ? this._hass.states[this._config.alert_entity]
      : null;
    const prefix     = this._config.name || "Portail";

    const isUnavailable =
      !contactEnt ||
      contactEnt.state === "unavailable" ||
      contactEnt.state === "unknown";

    let label, iconName, bg, color;

    if (isUnavailable) {
      label    = `${prefix} · ${labels.badgeUnavail}`;
      iconName = "gate-open-alert";
      bg       = "rgba(158, 158, 158, 0.15)";
      color    = "var(--disabled-color, #9e9e9e)";
    } else if (alertEnt && alertEnt.state === "on") {
      label    = `${prefix} · ${labels.badgeLongOpen}`;
      iconName = "gate-open-alert";
      bg       = "rgba(244, 67, 54, 0.15)";
      color    = "var(--error-color, #f44336)";
    } else if (contactEnt.state === "on") {
      label    = `${prefix} · ${labels.badgeOpen}`;
      iconName = "gate-open";
      bg       = "rgba(76, 175, 80, 0.15)";
      color    = "var(--success-color, #00c853)";
    } else {
      label    = `${prefix} · ${labels.badgeClosed}`;
      iconName = "gate-closed";
      bg       = "rgba(33, 150, 243, 0.15)";
      color    = "var(--primary-color, #2196f3)";
    }

    this._labelEl.textContent = label;
    const svgPath = GATE_SVG_PATHS[iconName];
    this._iconEl.innerHTML = svgPath
      ? `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="${color}" d="${svgPath}"/></svg>`
      : "";
    this._badgeEl.style.background = bg;
    this._badgeEl.style.color      = color;
  }

  static getConfigForm() {
    return {
      schema: [
        { name: "name",           label: "Nom (prefixe du libelle)",      selector: { text: {} } },
        { name: "contact_entity", label: "Capteur d'ouverture",           required: true,  selector: { entity: { domain: "binary_sensor" } } },
        { name: "alert_entity",   label: "Entite alerte duree (optionnel)", selector: { entity: { domain: "binary_sensor" } } },
      ],
    };
  }

  static getStubConfig() {
    return {
      name:           "Portail",
      contact_entity: "binary_sensor.ouverture_portail1_contact",
      alert_entity:   "binary_sensor.alerte_portail_1_ouvert_30_min",
    };
  }
}

// ---------------------------------------------------------------------------
// Enregistrement
// ---------------------------------------------------------------------------
customElements.define("portail-card",        PortailCard);
customElements.define("garage-switch-card",  GarageSwitchCard);
customElements.define("garage-cover-card",   GarageCoverCard);
customElements.define("portail-badge",       PortailBadge);

// Picker cartes
window.customCards = window.customCards || [];
window.customCards.push({
  type:        "portail-card",
  preview:     true,
  name:        "Portail (switch + capteur)",
  description: "Tuile portail avec commande et etat d'ouverture.",
  version:     GATE_CARD_VERSION,
});
window.customCards.push({
  type:        "garage-switch-card",
  preview:     true,
  name:        "Garage (switch + capteur)",
  description: "Tuile garage pilotee par switch avec etat d'ouverture.",
  version:     GATE_CARD_VERSION,
});
window.customCards.push({
  type:        "garage-cover-card",
  preview:     true,
  name:        "Garage (cover + capteur)",
  description: "Tuile garage pilotee par cover avec etat d'ouverture.",
  version:     GATE_CARD_VERSION,
});

// Picker badges (HA 2024+)
window.customBadges = window.customBadges || [];
window.customBadges.push({
  type:        "portail-badge",
  name:        "Badge Portail",
  description: "Badge compact etat portail avec degradation propre si entite indisponible.",
  preview:     true,
});
