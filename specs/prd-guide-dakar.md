# PRD — Guide Touristique Dakar

**Statut** : Validé

## Problème

Des visiteurs étrangers découvrent Dakar pendant les JOJ. Entre deux épreuves, ils ont quelques heures libres mais ne savent pas quoi faire : les animations culturelles sont annoncées partout, en désordre, et rien ne dit ce qui se passe maintenant.

## Utilisateurs

- Supporter étranger, à Dakar pour la première fois : trouver quelque chose à faire maintenant ou ce soir.
- Organisateur d'animations : ajouter ses animations pour qu'elles apparaissent dans l'agenda.

## Proposition

Un seul endroit qui répond à « qu'est-ce qui se passe maintenant ? » : les animations en cours à une heure donnée, avec leur lieu, et l'agenda complet d'une journée trié par heure. Les organisateurs y ajoutent leurs animations, publiées aussitôt. Plus tard, le supporter décrit en langage courant ce qu'il cherche : il ne connaît ni les quartiers ni les types d'animation, et un filtre suppose de savoir déjà ce qui existe.

## Mesure du succès

Pendant la démo, on demande ce qui se passe « maintenant » et on voit 2 animations en cours, chacune avec son lieu.

## Tranches

### TR1 — Animations en cours et agenda du jour

Le supporter consulte les animations en cours à une heure donnée, et l'agenda complet d'une journée trié par heure de début. Règle : une animation est en cours si l'heure demandée est entre son début et sa fin. Seulement l'API, sans écran.

### TR2 — Ajouter une animation

L'organisateur ajoute une animation (lieu, date, début, fin), qui apparaît aussitôt dans l'agenda, sans validation. Règles : la fin est après le début ; la date est dans les dates des JOJ.

### TR3 — Question en langage courant et écran de l'agenda

Le supporter pose une question en langage courant et reçoit jusqu'à 3 animations du jour qui y répondent, chacune avec une phrase d'explication. Règle : il ne reçoit jamais une animation qui n'existe pas ; sans correspondance, une liste vide et un message clair. Un écran affiche l'agenda du jour.

## Hors périmètre

- La réservation et la billetterie d'animations.
- Une carte interactive avec itinéraire, et la géolocalisation du visiteur.
- Les comptes des supporters et des organisateurs.
- La traduction en plusieurs langues.
- Les notifications et rappels.

## Hypothèses et risques

- Supposé : les JOJ Dakar 2026 se tiennent du 31 octobre au 13 novembre 2026. Si ces dates sont fausses, la règle de TR2 refuse ou accepte à tort.
- Supposé : les lieux sont une liste connue à l'avance, et chaque animation en a un. Sinon, le supporter ne sait pas où aller.
- Supposé : les heures sont celles de Dakar (GMT, sans heure d'été). Une confusion de fuseau ferait afficher les mauvaises animations « en cours ».
- Risque : sans comptes, n'importe qui peut ajouter une animation en TR2, pas seulement un organisateur.
- Risque : en TR3, la réponse en langage courant peut citer une animation inexistante ; la règle de TR3 doit l'empêcher.
