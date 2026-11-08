# 002 — Guide Touristique : consulter l'agenda et les animations en cours : plan

**Statut** : Validé

## 1. Résumé

On construit dans l'API un module `guide-touristique` qui permet de consulter l'agenda d'une journée et les animations en cours à un instant donné. Les lieux sont pré-chargés en base (seed) ; les animations sont lues, jamais créées dans cette tranche. Une animation est en cours si l'heure est dans l'intervalle `[heureDebut, heureFin[`. Deux routes HTTP suffisent : `GET /api/guide-touristique/agenda/:date` et `GET /api/guide-touristique/en-cours?at=`. Le travail tient en quatre tâches, une par couche. La proposition d'animation, la réponse en langage courant et tout écran sont laissés aux tranches suivantes.

Les mots de la spec et leur nom dans le code :

| Dans la spec         | Dans le code           | Ce que c'est                                                    |
| -------------------- | ---------------------- | --------------------------------------------------------------- |
| lieu                 | `Lieu`                 | un lieu touristique : nom, quartier, type parmi la liste fermée |
| animation            | `Animation`            | un événement culturel : nom, date, heureDebut, heureFin, lieu   |
| agenda d'une journée | `ListAnimationsDuJour` | le cas d'usage qui renvoie les animations d'une date            |
| animations en cours  | `GetAnimationsEnCours` | le cas d'usage qui filtre par `isEnCours(heure)`                |
| heure de début       | `heureDebut`           | format HH:MM, borne incluse de l'intervalle                     |
| heure de fin         | `heureFin`             | format HH:MM, borne exclue de l'intervalle                      |
| date                 | `date`                 | format YYYY-MM-DD                                               |
| instant donné        | `at`                   | paramètre query ISO 8601 (ex : `2026-11-01T10:30:00Z`)          |

## 2. Fichiers par couche

Le module `guide-touristique` existe déjà dans `apps/api/src/modules/guide-touristique/`, construit sur le modèle du module `disciplines`. Cette tranche confirme et complète ce qui a été posé.

- **shared** — `packages/shared/src/guide-touristique.ts` : `lieuSchema`, `animationSchema` (avec `lieu` embarqué), `dateParamsSchema`, `atQuerySchema`, `animationListSchema`. Exporté par `index.ts`.
- **domain**
  - `domain/lieu.ts` : `Lieu.create()` / `Lieu.restore()`.
  - `domain/animation.ts` : `Animation.create()` / `Animation.restore()` ; `animation.isEnCours(heure: string): boolean` — vrai si `heure >= heureDebut && heure < heureFin`.
  - `domain/guide-touristique.errors.ts` : `GuideTouristiqueError` dérivée d'`AppError`, avec les codes de la section 4.
- **application**
  - `application/animation.repository.ts` : port `AnimationRepository`, classe abstraite — `listByDate(date)`, `findLieuById(id)`, `insert(animation)`.
  - `application/use-cases/list-animations-du-jour.ts` : `ListAnimationsDuJour.execute(date)` → délègue à `listByDate`.
  - `application/use-cases/get-animations-en-cours.ts` : `GetAnimationsEnCours.execute(dateHeure)` → extrait date (`slice(0,10)`) et heure (`slice(11,16)`), appelle `listByDate`, filtre par `isEnCours`.
  - `application/testing/in-memory-animation.repository.ts` : `InMemoryAnimationRepository` — `seedLieux(lieux)`, `Map` pour animations et lieux, `clone` via `restore()`.
- **infra**
  - `infra/lieux.schema.ts` : table `lieux` (`id` uuid PK, `nom` varchar 150, `quartier` varchar 100, `type` varchar 50).
  - `infra/animations.schema.ts` : table `animations` (`id` uuid PK, `nom` varchar 150, `date` date, `heure_debut` time, `heure_fin` time, `lieu_id` uuid FK → `lieux.id`).
  - `infra/animation.mapper.ts` : `lieuToDomain`, `lieuToRow`, `animationToDomain(row, lieu)`, `animationToRow` — `heureFin.slice(0,5)` pour normaliser `HH:MM:SS` → `HH:MM`.
  - `infra/drizzle-animation.repository.ts` : `DrizzleAnimationRepository` — `listByDate` via `innerJoin` + `eq(date)` + `orderBy(heureDebut)` ; `findLieuById` ; `insert`.
- **http**
  - `http/guide-touristique.controller.ts` : controller fin — `GET /api/guide-touristique/agenda/:date` (DateParamsDto) et `GET /api/guide-touristique/en-cours?at=` (AtQueryDto).
  - `guide-touristique.module.ts` : relie `AnimationRepository` → `DrizzleAnimationRepository`, déclare les deux cas d'usage.
  - `apps/api/src/app.module.ts` : `GuideTouristiqueModule` ajouté aux `imports`.
- **données** — `apps/api/data/lieux.json` (12 lieux), `apps/api/data/animations.json` (14 animations) chargés par `pnpm db:seed`.
- **web** — handlers MSW `GET */api/guide-touristique/agenda/:date` et `GET */api/guide-touristique/en-cours` dans `apps/web/src/mocks/handlers.ts` ; fixtures `lieuMusee`, `lieuMarche`, `animationMatin`, `animationApresMidi` dans `fixture.ts`.

## 3. Données

Deux tables, lues mais pas écrites par l'API dans cette tranche (les données viennent du seed). Migration : `0002_create_lieux_and_animations.sql` — déjà générée.

- **`lieux`** : `id` (uuid, PK), `nom` (varchar 150, non nul), `quartier` (varchar 100, non nul), `type` (varchar 50, non nul).
- **`animations`** : `id` (uuid, PK), `nom` (varchar 150, non nul), `date` (date, non nul), `heure_debut` (time, non nul), `heure_fin` (time, non nul), `lieu_id` (uuid, FK → `lieux.id`, non nul).

## 4. Erreurs

| Code AppError                    | Catégorie     | HTTP | Quand                                         | Scénario |
| -------------------------------- | ------------- | ---- | --------------------------------------------- | -------- |
| `ANIMATION_INVALID_DATE`         | VALIDATION    | 400  | format de date invalide (pas YYYY-MM-DD)      | AS5      |
| `ANIMATION_OUTSIDE_GAMES_PERIOD` | BUSINESS_RULE | 422  | date hors de la période JOJ (oct 31 – nov 13) | AS5      |
| `ANIMATION_NOM_REQUIRED`         | VALIDATION    | 400  | nom d'animation vide                          | —        |
| `ANIMATION_NOM_TOO_LONG`         | VALIDATION    | 400  | nom > 150 caractères                          | —        |
| `ANIMATION_FIN_BEFORE_DEBUT`     | VALIDATION    | 400  | heureFin ≤ heureDebut                         | —        |
| `LIEU_NOT_FOUND`                 | NOT_FOUND     | 404  | aucun lieu ne porte l'identifiant donné       | —        |
| `ANIMATION_NOT_FOUND`            | NOT_FOUND     | 404  | aucune animation ne porte l'identifiant donné | —        |

Les données mal formées (`date` au mauvais format, paramètre `at` absent ou invalide) sont refusées par les DTOs Zod avant d'atteindre le domaine (400, `VALIDATION_FAILED`, avec la liste des champs invalides).

## 5. Tests par scénario

| Scénario | Fichier de test                                                   | Niveau   | Ce que le test vérifie                                                           |
| -------- | ----------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| AS1      | `application/guide-touristique.application.spec.ts`               | unitaire | trois animations renvoyées triées par heureDebut ; chaque animation a son lieu   |
| AS1      | `apps/api/test/guide-touristique.e2e.spec.ts`                     | e2e      | `GET /agenda/2026-11-01` renvoie 3 animations dans l'ordre 09:00, 10:00, 14:00   |
| AS2      | `application/guide-touristique.application.spec.ts`               | unitaire | `listByDate` sur un jour sans animation renvoie `[]`                             |
| AS2      | `apps/api/test/guide-touristique.e2e.spec.ts`                     | e2e      | `GET /agenda/2026-11-05` renvoie `[]` avec statut 200                            |
| AS3      | `application/guide-touristique.application.spec.ts`               | unitaire | à 10 h 30 : « Concert de kora » et « Visite guidée » en cours, « Marché » non    |
| AS3      | `apps/api/test/guide-touristique.e2e.spec.ts`                     | e2e      | `GET /en-cours?at=2026-11-01T10:30:00Z` renvoie 2 animations                     |
| AS4      | `apps/api/src/modules/guide-touristique/domain/animation.spec.ts` | unitaire | `isEnCours('09:00')` vrai, `isEnCours('11:00')` faux                             |
| AS4      | `apps/api/test/guide-touristique.e2e.spec.ts`                     | e2e      | à 09:00 : en cours ; à 11:00 : plus en cours                                     |
| AS5      | `apps/api/test/guide-touristique.e2e.spec.ts`                     | e2e      | `GET /agenda/01-11-2026` → 400 `VALIDATION_FAILED` avec `errors[].path` à `date` |
| AS6      | `apps/api/test/guide-touristique.e2e.spec.ts`                     | e2e      | `GET /en-cours` sans `?at` → 400 `VALIDATION_FAILED`                             |

## 6. Tâches

Quatre tâches, dans l'ordre des couches ; chacune tient dans un commit.

- [x] T01 [002-AS4] Domaine et schémas partagés : `domain/animation.spec.ts` (« 002-AS4: isEnCours is true at heureDebut and false at heureFin »), `packages/shared/src/guide-touristique.ts`, `domain/lieu.ts`, `domain/animation.ts`, `domain/guide-touristique.errors.ts`
- [x] T02 [002-AS1, AS2, AS3] Application : `application/guide-touristique.application.spec.ts` (« 002-AS1: lists animations sorted by heureDebut », « 002-AS2: returns empty list when no animations », « 002-AS3: returns only animations in progress »), port `AnimationRepository`, repo en mémoire, `ListAnimationsDuJour`, `GetAnimationsEnCours`
- [x] T03 [002-AS1, AS2] Infra : `infra/drizzle-animation.repository.int.spec.ts` (« 002-AS1: reads back what it wrote with joined lieu », « 002-AS2: returns empty for a day without animations »), schémas Drizzle, migration, mapper, `DrizzleAnimationRepository`
- [x] T04 [002-AS1, AS2, AS3, AS4, AS5, AS6] HTTP et e2e : `apps/api/test/guide-touristique.e2e.spec.ts` (un test par scénario), controller, module, ajout dans `app.module.ts`, handlers MSW et fixtures

## 7. Corrections

### Passage 1

Les écarts relevés lors de la première convergence : la traçabilité en échec et le rapport du relecteur. Chaque tâche cite le scénario concerné et la preuve.

- [x] T05 [002-AS2, AS4, AS6] Renommer d'abord les tests existants pour que chaque titre commence par l'identifiant du scénario qu'il prouve, selon la numérotation de la spec : liste vide → « 002-AS2: … » (`apps/api/test/guide-touristique.e2e.spec.ts:44`, `application/guide-touristique.application.spec.ts:61`), bornes 9 h incluse et 11 h exclue → « 002-AS4: … » (e2e:73-90, application, domaine), `at` absent → « 002-AS6: … » (e2e:100-103), animations en cours → « 002-AS3: … », agenda → « 002-AS1: … », date invalide → « 002-AS5: … » ; les tests du domaine qui portent des règles de TR2 (nom, période des JOJ) ne citent aucun scénario de 002. Preuve : `pnpm spec:check specs/002-guide-touristique --trace` affiche « (aucun test) » pour les six scénarios et sort en code 1 ; relecteur, points 1, 7, 8 et 9.
- [ ] T06 [002-AS1] Écrire d'abord dans `apps/api/test/guide-touristique.e2e.spec.ts` le test « 002-AS1: returns the day's animations sorted by start time, each with its place name and district », avec les trois animations de la spec (« Concert de kora », « Visite guidée », « Marché artisanal ») et des valeurs précises pour `lieu.nom` et `lieu.quartier`, puis corriger le code si le test échoue. Preuve : relecteur, point 2 (e2e:46-61 ne vérifie que `nom: expect.any(String)`, jamais `quartier`).
- [ ] T07 [002-AS5] Écrire d'abord dans `apps/api/test/guide-touristique.e2e.spec.ts` les tests « 002-AS5: rejects a malformed date (400, errors on date) » et « 002-AS5: rejects a malformed instant (400, errors on at) », qui vérifient `errors[].path`, puis corriger le code si le test échoue. Preuve : relecteur, point 3 (e2e:93-97 ne vérifie pas `errors`, et `at` mal formé n'est pas testé).
- [ ] T08 [002-AS5] Écrire d'abord dans `apps/api/test/guide-touristique.e2e.spec.ts` le test « 002-AS5: rejects an impossible calendar date (400, not 500) » (`GET /api/guide-touristique/agenda/2026-13-45`), puis refuser une date de calendrier invalide dans `dateParamsSchema` (`packages/shared/src/guide-touristique.ts`). Preuve : relecteur, point 5 (la date passe le motif, PostgreSQL lève `date/time field value out of range`, d'où une réponse 500 `INTERNAL_ERROR` ; `infra/drizzle-animation.repository.ts:23`).
- [ ] T09 [002-AS3] Écrire d'abord dans `application/guide-touristique.application.spec.ts` le test « 002-AS3: converts an instant with an offset to Dakar time » (`2026-11-01T11:30:00+01:00` → les animations en cours à 10 h 30 le 1er novembre), puis ramener l'instant à UTC avant d'extraire la date et l'heure dans `application/use-cases/get-animations-en-cours.ts`. Preuve : relecteur, point 6 (`get-animations-en-cours.ts:15-16` découpe la chaîne brute ; `2026-11-01T01:30:00+02:00` donne le 1er novembre à 1 h 30 au lieu du 31 octobre à 23 h 30).
- [ ] T10 [002-AS1] Écrire d'abord un test du chargement des données de démonstration (dans `apps/api/scripts/`, à côté de `db-core.mts`) qui prouve que les lieux sont chargés avant les animations, puis ordonner le chargement selon les dépendances des tables (`apps/api/scripts/db.mts:92-104`). Preuve : relecteur, point 4 (`pnpm db:seed` sur une base neuve échoue sur la clé étrangère `animations_lieu_id_lieux_id_fk`, car `animations.json` est chargé avant `lieux.json`).
