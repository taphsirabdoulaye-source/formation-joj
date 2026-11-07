# 002 — Guide Touristique : consulter l'agenda et les animations en cours

**Statut** : Validée
**PRD** : specs/prd-guide-touristique.md, TR1

## Contexte

Des visiteurs étrangers sont à Dakar pour les JOJ pour la première fois. Entre deux épreuves, ils ont quelques heures devant eux mais ne savent pas quoi faire. Cette première tranche leur permet de consulter l'agenda culturel d'une journée et de savoir ce qui se passe en ce moment. Seulement par l'API, sans écran.

## User stories

- En tant que visiteur, je veux consulter toutes les animations d'une journée triées par heure de début, afin de planifier ma soirée entre deux épreuves.
- En tant que visiteur, je veux savoir quelles animations sont en cours à un instant précis, afin de décider où me rendre maintenant.

## Scénarios d'acceptation

### AS1 — Agenda d'une journée

- **Étant donné** trois animations le 1er novembre 2026 : « Concert de kora » de 9 h à 11 h, « Visite guidée » de 10 h à 12 h, « Marché artisanal » de 14 h à 17 h
- **Quand** le visiteur demande l'agenda du 1er novembre 2026
- **Alors** les trois animations lui sont renvoyées triées par heure de début (9 h, 10 h, 14 h), chacune avec le nom et le quartier de son lieu

### AS2 — Aucune animation ce jour-là

- **Étant donné** qu'aucune animation n'est prévue le 5 novembre 2026
- **Quand** le visiteur demande l'agenda du 5 novembre 2026
- **Alors** une liste vide lui est renvoyée (200, pas 404)

### AS3 — Animations en cours à un instant donné

- **Étant donné** les animations du 1er novembre 2026 : « Concert de kora » de 9 h à 11 h, « Visite guidée » de 10 h à 12 h, « Marché artisanal » de 14 h à 17 h
- **Quand** le visiteur demande ce qui se passe le 1er novembre 2026 à 10 h 30
- **Alors** seules « Concert de kora » et « Visite guidée » lui sont renvoyées — une animation est en cours si l'heure est dans l'intervalle `[heureDebut, heureFin[`

### AS4 — Borne de début incluse, borne de fin exclue

- **Étant donné** l'animation « Concert de kora » de 9 h à 11 h
- **Quand** le visiteur demande ce qui se passe exactement à 9 h 00
- **Alors** « Concert de kora » est en cours
- **Quand** le visiteur demande ce qui se passe exactement à 11 h 00
- **Alors** « Concert de kora » n'est plus en cours

### AS5 — Date invalide

- **Étant donné** une date au mauvais format (ex : « 01-11-2026 » au lieu de « 2026-11-01 »), ou un instant mal formé
- **Quand** le visiteur interroge l'agenda ou les animations en cours
- **Alors** refus 400 avec le code `VALIDATION_FAILED` et la liste des champs invalides, au format RFC 9457

### AS6 — Paramètre manquant pour les animations en cours

- **Étant donné** qu'aucun instant n'est fourni pour la route des animations en cours
- **Quand** le visiteur interroge la route sans paramètre `at`
- **Alors** refus 400 avec le code `VALIDATION_FAILED`

## Hors périmètre

- Proposer une nouvelle animation (TR2).
- Répondre en langage courant via Claude, et tout écran (TR3).
- Modifier ou supprimer une animation ou un lieu.
- Les comptes utilisateurs et la gestion des droits.

## Questions ouvertes

- La borne de fin est exclue de l'intervalle `[heureDebut, heureFin[` : supposée exclue (AS4), car une animation qui vient de se terminer n'est plus en cours. À discuter si l'usage veut une borne incluse.
- Les animations d'une journée sans fuseau horaire : supposées stockées en heure locale de Dakar (UTC+0 pendant les JOJ). L'instant transmis en UTC ne pose donc pas de problème de conversion.
- Une date dans la période des JOJ mais sans animation : liste vide renvoyée (AS2), pas une erreur.
