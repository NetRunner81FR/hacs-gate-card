# Changelog

## 1.1.0

- Seuil alerte visuelle configurable par tuile : parametre optionnel `visual_threshold_minutes` (portail-card, garage-switch-card, garage-cover-card).
- Sans override, le seuil par defaut est 30 min (configurable globalement via `input_number.portail_seuil_visuel` avec le package exemple fourni).
- Le label d'etat "Ouvert > X min" reflete le seuil effectif de chaque carte.
- Ajout du champ `visual_threshold_minutes` dans l'editeur UI des 3 types de cartes.
- Exemple de package HA `examples/portail-package-example.yaml` pour configuration globale optionnelle.

## 1.0.0

- Release stable gate-card.
- Composants : portail-card, garage-switch-card, garage-cover-card, portail-badge.

## 0.5.0-beta.5

- Correct HACS release notes after beta.4 publication.
- Align Gate Card JavaScript version metadata with the published beta tag.

## 0.5.0-beta.4

- Publish Gate Card through the secured beta GitHub publication workflow.
- Add required README and CHANGELOG metadata for HACS beta release automation.

## 0.5.0-beta.3

- Prepare standalone HACS card staging.
- Add required publication metadata files for beta release automation.
