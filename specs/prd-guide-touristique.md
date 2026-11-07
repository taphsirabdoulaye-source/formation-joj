# PRD — Guide Touristique Dakar

**Statut** : Validé

## Problème

Des milliers de visiteurs et de supporters étrangers sont à Dakar pour les JOJ pour la première fois. Entre deux épreuves, ils ont quelques heures devant eux mais ne savent pas quoi faire : les animations culturelles et touristiques sont annoncées en désordre sur plusieurs canaux, rien ne dit ce qui se passe en ce moment, ce qui vaut le détour, ou où se rendre dans un quartier donné. Résultat : beaucoup de visiteurs restent dans leur hôtel faute d'information accessible.

## Utilisateurs

- Supporter étranger : consulter ce qui se passe maintenant ou dans la journée, trouver une idée entre deux épreuves.
- Organisateur local : référencer un nouveau lieu ou proposer une animation pendant les Jeux, pour que les visiteurs sachent que ça existe.

## Proposition

Une API qui expose l'agenda d'une journée (toutes les animations, triées par heure) et la liste des animations en cours à un instant donné. Les organisateurs peuvent proposer de nouvelles animations, sous réserve de règles de validité (horaires cohérents, date dans la période des Jeux). Contrairement aux canaux dispersés, tout est dans un seul endroit, interrogeable par date ou par heure.

## Mesure du succès

Pendant la démo, on interroge l'API pour « maintenant » (un jour et une heure pendant les JOJ) et on obtient au moins deux animations en cours avec leur lieu et leur quartier. On ajoute une animation via l'API, puis on la retrouve dans l'agenda du jour.

## Tranches

### TR1 — Consulter l'agenda et les animations en cours

Un visiteur interroge l'API avec une date (format `YYYY-MM-DD`) et obtient toutes les animations de ce jour, triées par heure de début, avec le nom et le quartier de leur lieu. Il peut aussi interroger avec un instant précis (format ISO 8601) et obtenir uniquement les animations en cours à cet instant : une animation est en cours si l'heure est dans l'intervalle `[heureDebut, heureFin[`. Une date invalide ou hors de la période des JOJ est refusée. Seulement l'API, pas d'écran.

### TR2 — Proposer une animation

Un organisateur propose une nouvelle animation en précisant son nom, le lieu (parmi les lieux connus), la date et les heures de début et de fin. Règles : la fin doit être après le début ; la date doit être dans la période des Jeux (31 octobre – 13 novembre 2026) ; un lieu inconnu est refusé. Seulement l'API.

### TR3 — Répondre en langage courant et écran de l'agenda

Un visiteur pose une question en langage courant (« que faire ce soir près de Médina ? ») et reçoit jusqu'à trois animations du jour qui y correspondent, avec une phrase d'explication rédigée par un assistant IA. Règles : une question vide est refusée ; seules des animations qui existent en base sont proposées. Un écran affiche l'agenda du jour avec les animations en cours mises en évidence.

## Hors périmètre

- La modification ou la suppression d'une animation ou d'un lieu.
- Les comptes utilisateurs et la gestion des droits (responsable vs visiteur).
- Les notifications ou rappels d'animations.
- La géolocalisation du visiteur.

## Hypothèses et risques

- Supposé : les lieux sont pré-chargés en base (seed) ; seules les animations sont créées par l'API. Si un lieu manque, l'organisateur ne peut pas proposer l'animation.
- Supposé : l'heure transmise est en UTC ; les animations sont stockées en heure locale de Dakar (UTC+0 pendant les Jeux). L'écart est nul, mais à vérifier si le fuseau change.
- Risque : sans compte, n'importe qui peut proposer une animation ; on fait confiance aux utilisateurs pour TR2.
- Supposé pour TR3 : les crédits API Claude sont disponibles pendant la démo et les tests n'appellent jamais le vrai modèle (port + fake en tests).
