# 001 — Bénévoles : ouvrir un créneau et s'y inscrire

**Statut** : Validée
**PRD** : specs/prd-benevoles.md, TR1

## Contexte

Les responsables de discipline gèrent sur papier les inscriptions des bénévoles d'accueil, et des créneaux débordent. Cette première tranche fait appliquer la capacité d'un créneau au moment même de l'inscription. Seulement par l'API, sans écran.

## User stories

- En tant que responsable de discipline, je veux ouvrir un créneau d'accueil avec un début, une fin et une capacité maximale, afin d'annoncer combien de bénévoles il me faut.
- En tant que bénévole, je veux m'inscrire sur un créneau avec mon nom et mon email, afin de réserver ma place.

## Scénarios d'acceptation

### AS1 — Ouvrir un créneau

- **Étant donné** la discipline « Lutte »
- **Quand** le responsable ouvre pour elle un créneau du 1er novembre 2026 de 9 h à 12 h, de capacité 2
- **Alors** le créneau est enregistré avec sa discipline, son début, sa fin, sa capacité 2 et aucun inscrit

### AS2 — Créneau invalide

- **Étant donné** une capacité inférieure à 1, ou une fin qui n'est pas après le début
- **Quand** le responsable ouvre le créneau
- **Alors** c'est refusé avec un message de validation qui nomme le champ fautif, et aucun créneau n'est enregistré

### AS3 — Discipline inconnue

- **Étant donné** qu'aucune discipline ne porte l'identifiant donné
- **Quand** le responsable ouvre un créneau pour elle
- **Alors** c'est refusé avec un message « introuvable », et aucun créneau n'est enregistré

### AS4 — S'inscrire sur un créneau

- **Étant donné** un créneau de capacité 2 sans inscrit
- **Quand** la bénévole Awa Diop (awa.diop@example.com) s'y inscrit
- **Alors** l'inscription est enregistrée avec son nom et son email, et le créneau compte 1 inscrit

### AS5 — Créneau complet

- **Étant donné** un créneau de capacité 2 qui a déjà 2 inscrits
- **Quand** un troisième bénévole s'y inscrit
- **Alors** refus 409 avec le code SLOT_FULL, et le créneau compte toujours 2 inscrits

### AS6 — Inscription invalide ou créneau inconnu

- **Étant donné** un nom vide ou un email mal formé, ou un créneau qui n'existe pas
- **Quand** le bénévole s'inscrit
- **Alors** c'est refusé (message de validation pour le nom ou l'email, « introuvable » pour le créneau), et aucune inscription n'est enregistrée

## Hors périmètre

- Consulter un créneau et ses inscrits, et refuser un email déjà inscrit (TR2).
- Se désinscrire, et tout écran (TR3).
- Modifier ou supprimer un créneau, les emails de confirmation, les comptes des bénévoles (hors périmètre du PRD).

## Questions ouvertes

- Une fin avant ou égale au début : je l'ai supposée refusée (AS2), car un tel créneau n'a pas de sens. À retirer si tu ne la veux pas.
- Deux inscriptions simultanées sur la dernière place : une seule doit passer (AS5 doit tenir même dans ce cas). Hypothèse : le plan le garantit.
- Un créneau dans le passé : hypothèse, accepté (aucune règle dans la demande).
