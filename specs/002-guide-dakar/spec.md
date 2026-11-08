# 002 — Guide Dakar : animations en cours et agenda du jour

**Statut** : Validée
**PRD** : specs/prd-guide-dakar.md, TR1

## Contexte

Un supporter étranger, entre deux épreuves, ne sait pas ce qui se passe à Dakar en ce moment : les animations sont annoncées partout, en désordre. Cette tranche lui donne, par l'API, les animations en cours à une heure donnée et l'agenda d'une journée.

## User stories

- En tant que supporter étranger, je veux voir les animations en cours à une heure donnée, avec leur lieu, afin de savoir où aller tout de suite.
- En tant que supporter étranger, je veux l'agenda complet d'une journée trié par heure, afin d'organiser mon temps libre.

## Scénarios d'acceptation

### AS1 — Animations en cours à une heure donnée

- **Étant donné** le 5 novembre 2026 : « Sabar » de 17 h à 19 h place de l'Indépendance, « Expo photo » de 17 h 30 à 20 h au Village des JOJ, et « Concert » de 20 h à 22 h à la plage de Ngor
- **Quand** le supporter demande les animations en cours le 5 novembre à 18 h
- **Alors** il reçoit exactement « Sabar » et « Expo photo », chacune avec son titre, son lieu, son début et sa fin ; « Concert » n'y est pas

### AS2 — Maintenant, par défaut

- **Étant donné** les animations de AS1, et qu'il est 18 h le 5 novembre à Dakar
- **Quand** le supporter demande les animations en cours sans préciser d'heure
- **Alors** il reçoit les mêmes 2 animations qu'en AS1

### AS3 — Bornes d'une animation

- **Étant donné** « Sabar » de 17 h à 19 h
- **Quand** le supporter demande les animations en cours à 17 h, puis à 19 h
- **Alors** « Sabar » est en cours à 17 h, et ne l'est plus à 19 h

### AS4 — Aucune animation en cours

- **Étant donné** les animations de AS1
- **Quand** le supporter demande les animations en cours le 5 novembre à 23 h
- **Alors** il reçoit une liste vide, sans erreur

### AS5 — Agenda d'une journée trié par heure

- **Étant donné** les animations de AS1, et « Danse » le 6 novembre à 10 h
- **Quand** le supporter demande l'agenda du 5 novembre
- **Alors** il reçoit « Sabar », « Expo photo » puis « Concert », dans cet ordre, chacune avec son lieu ; « Danse » n'y est pas ; une journée sans animation donne une liste vide

### AS6 — Heure ou date invalide

- **Étant donné** une heure ou une date mal formée (par exemple « demain » ou « 2026-13-40 »)
- **Quand** le supporter demande les animations en cours ou l'agenda
- **Alors** c'est refusé avec un message de validation qui nomme le paramètre fautif

## Hors périmètre

- Ajouter une animation (TR2) ; la question en langage courant et l'écran de l'agenda (TR3).
- Filtrer par lieu, par quartier ou par type d'animation.
- Tout ce que le PRD exclut : réservation, carte, comptes, traduction, notifications, géolocalisation.

## Questions ouvertes

- D'où viennent les animations avant TR2 ? Hypothèse : un jeu de données de démonstration (lieux et animations) chargé dans la base.
- Une animation a un titre en plus de son lieu, de son début et de sa fin. Hypothèse : oui, sinon le supporter ne sait pas ce qu'il va voir.
- Bornes : hypothèse, une animation est en cours de son début inclus à sa fin exclue (AS3).
- Heures : hypothèse, celles de Dakar (GMT, sans heure d'été) ; « maintenant » est l'heure courante à Dakar (AS2).
- Une animation qui passe minuit apparaît dans l'agenda du jour où elle commence. Hypothèse retenue, sans scénario.
