# 001 — Bénévoles : ouvrir un créneau et s'y inscrire : plan

**Statut** : Validé

## 1. Résumé

On construit dans l'API un module `volunteers` qui permet d'ouvrir un créneau d'accueil pour une discipline existante et d'y inscrire des bénévoles. Une fois les tâches terminées, un responsable peut ouvrir un créneau avec un début, une fin et une capacité, et un bénévole peut s'y inscrire avec son nom et son email. L'API refuse l'inscription de trop avec un statut 409 et le code `SLOT_FULL`, même quand deux inscriptions arrivent en même temps. Le travail tient en quatre tâches, une par couche : les schémas partagés et le domaine, les cas d'usage, la persistance, puis les routes HTTP. La consultation d'un créneau, le refus d'un email déjà inscrit, la désinscription et tout écran sont laissés aux tranches suivantes.

Les mots de la spec et leur nom dans le code :

| Dans la spec          | Dans le code         | Ce que c'est                                                        |
| --------------------- | -------------------- | ------------------------------------------------------------------- |
| bénévoles (le module) | `volunteers`         | le module de l'API qui regroupe les créneaux et les inscriptions    |
| créneau               | `Slot`               | une plage d'accueil d'une discipline : début, fin, capacité         |
| début, fin            | `startsAt`, `endsAt` | les instants de début et de fin du créneau, en ISO 8601 avec fuseau |
| capacité maximale     | `capacity`           | le nombre maximal de bénévoles inscrits sur le créneau, au moins 1  |
| nombre d'inscrits     | `registeredCount`    | le nombre d'inscriptions du créneau, calculé, jamais stocké         |
| inscription           | `Registration`       | un bénévole (nom, email) inscrit sur un créneau                     |
| ouvrir un créneau     | `OpenSlot`           | le cas d'usage qui crée un créneau                                  |
| inscrire un bénévole  | `RegisterVolunteer`  | le cas d'usage qui inscrit un bénévole sur un créneau               |

## 2. Fichiers par couche

On crée le module `volunteers` dans `apps/api/src/modules/volunteers/`, organisé comme le module Disciplines : un dossier par couche. Voici chaque fichier, couche par couche.

- **shared**
  - `packages/shared/src/volunteers.ts` contient les schémas Zod échangés avec l'API : `openSlotSchema` (corps de l'ouverture : `disciplineId`, `startsAt`, `endsAt`, `capacity` entier d'au moins 1, avec un `refine` qui exige `endsAt` après `startsAt` et signale le champ `endsAt`), `slotSchema` (le créneau renvoyé, avec `registeredCount`), `slotIdParamsSchema` (le paramètre `:id`), `registerVolunteerSchema` (corps de l'inscription : `name` non vide d'au plus 100 caractères après `trim`, `email` au format email) et `registrationSchema` (l'inscription renvoyée).
  - `packages/shared/src/index.ts` réexporte ce nouveau fichier.
- **domain**
  - `domain/slot.ts` contient l'entité `Slot`. `Slot.create()` refuse une capacité inférieure à 1 ou une fin qui n'est pas après le début ; `Slot.restore()` la relit depuis la base avec son `registeredCount` ; `slot.register()` crée une `Registration` et lève `SLOT_FULL` quand le créneau est complet.
  - `domain/registration.ts` contient l'entité `Registration`. `Registration.create()` refuse un nom vide et un email mal formé ; `Registration.restore()` la relit depuis la base.
  - `domain/volunteers.errors.ts` contient `VolunteerError`, qui dérive de `AppError`, ses codes (section 4) et les fonctions `slotFull()`, `slotNotFound()` et `slotDisciplineNotFound()`.
- **application**
  - `application/slot.repository.ts` est le port `SlotRepository`, une classe abstraite : `disciplineExists(id)`, `findById(id)` (créneau avec son nombre d'inscrits), `insert(slot)` et `addRegistration(registration)`. Ce dernier revérifie la capacité de façon atomique et lève `SLOT_FULL` si le créneau s'est rempli entre-temps.
  - `application/use-cases/open-slot.ts` contient `OpenSlot` : il vérifie que la discipline existe, crée le `Slot` et l'enregistre.
  - `application/use-cases/register-volunteer.ts` contient `RegisterVolunteer` : il charge le créneau, appelle `slot.register()`, puis `addRegistration()`.
  - `application/testing/in-memory-slot.repository.ts` est le repository en mémoire des tests ; il reçoit à sa construction la liste des disciplines qui existent.
- **infra**
  - `infra/volunteers.schema.ts` contient les tables Drizzle `slots` et `registrations` (section 3).
  - `infra/slot.mapper.ts` et `infra/registration.mapper.ts` contiennent `toDomain()` et `toRow()` pour chaque entité.
  - `infra/drizzle-slot.repository.ts` implémente `SlotRepository`. `addRegistration()` ouvre une transaction, verrouille la ligne du créneau (`SELECT … FOR UPDATE`), compte ses inscriptions, puis insère l'inscription ou lève `SLOT_FULL`.
- **http**
  - `http/slots.controller.ts` est le controller fin. Il porte deux routes :
    - `POST /api/slots` ouvre un créneau à partir du corps `openSlotSchema` et renvoie 201 avec le créneau (`slotSchema`, `registeredCount` à 0).
    - `POST /api/slots/:id/registrations` inscrit un bénévole à partir du corps `registerVolunteerSchema` et renvoie 201 avec l'inscription (`registrationSchema`).
  - `volunteers.module.ts` relie le port `SlotRepository` à `DrizzleSlotRepository` et déclare les cas d'usage.
  - `apps/api/src/app.module.ts` ajoute `VolunteersModule` à ses `imports`.
- **web** : rien. L'écran est hors périmètre de cette tranche, et la fausse API MSW n'a pas besoin de ces routes tant qu'aucun écran ne les appelle.

## 3. Données

On stocke les créneaux et leurs inscriptions dans deux tables. Le nombre d'inscrits n'est pas stocké : il est compté à la lecture. Migration : `pnpm db:generate --name=create_slots_and_registrations`.

- **`slots`** : `id` (uuid, clé primaire), `discipline_id` (uuid, non nul), `starts_at` et `ends_at` (timestamp avec fuseau, précision milliseconde, non nuls), `capacity` (entier, non nul), `created_at` (timestamp avec fuseau, non nul).
  - Une clé étrangère `discipline_id` → `disciplines.id`, `ON DELETE CASCADE`, garantit que tout créneau appartient à une discipline existante (AS3).
  - Une contrainte `CHECK (capacity >= 1)` protège la capacité minimale (AS2).
  - Une contrainte `CHECK (ends_at > starts_at)` protège l'ordre du début et de la fin (AS2).
- **`registrations`** : `id` (uuid, clé primaire), `slot_id` (uuid, non nul), `name` (varchar 100, non nul), `email` (varchar 254, non nul), `created_at` (timestamp avec fuseau, non nul).
  - Une clé étrangère `slot_id` → `slots.id`, `ON DELETE CASCADE`, garantit que toute inscription vise un créneau existant (AS6).
  - Un index sur `slot_id` accélère le comptage des inscrits d'un créneau.
  - La capacité (AS5) ne s'exprime pas par une contrainte : elle est protégée par le verrou de ligne sur le créneau, pris dans la transaction de `addRegistration()`.

## 4. Erreurs

Chaque refus de la spec devient une `VolunteerError` avec un code stable ; le `ProblemDetailsFilter` existant choisit le statut HTTP à partir de la catégorie. Les données mal formées sont d'abord refusées par les schémas Zod (400, avec la liste des champs invalides) ; le domaine les revérifie, comme dans le module Disciplines.

| Code AppError                | Catégorie  | HTTP | Quand                                                 | Scénario |
| ---------------------------- | ---------- | ---- | ----------------------------------------------------- | -------- |
| `SLOT_CAPACITY_INVALID`      | VALIDATION | 400  | la capacité n'est pas un entier d'au moins 1          | AS2      |
| `SLOT_ENDS_BEFORE_START`     | VALIDATION | 400  | la fin n'est pas strictement après le début           | AS2      |
| `SLOT_DISCIPLINE_NOT_FOUND`  | NOT_FOUND  | 404  | aucune discipline ne porte l'identifiant donné        | AS3      |
| `SLOT_FULL`                  | CONFLICT   | 409  | le créneau a déjà autant d'inscrits que sa capacité   | AS5      |
| `REGISTRATION_NAME_REQUIRED` | VALIDATION | 400  | le nom du bénévole est vide ou fait d'espaces         | AS6      |
| `REGISTRATION_EMAIL_INVALID` | VALIDATION | 400  | l'email du bénévole est mal formé                     | AS6      |
| `SLOT_NOT_FOUND`             | NOT_FOUND  | 404  | aucun créneau ne porte l'identifiant de l'inscription | AS6      |

## 5. Tests par scénario

Chaque scénario de la spec est prouvé par au moins un test, au niveau le plus bas qui suffit. Le test e2e reprend chaque scénario une fois, pour vérifier les statuts HTTP et le format RFC 9457.

| Scénario | Fichier de test                                                              | Niveau      | Ce que le test vérifie                                                                                                      |
| -------- | ---------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| AS1      | `apps/api/src/modules/volunteers/application/volunteers.application.spec.ts` | unitaire    | le créneau ouvert a sa discipline, son début, sa fin, sa capacité 2 et 0 inscrit                                            |
| AS1      | `apps/api/test/slots.e2e.spec.ts`                                            | e2e         | `POST /api/slots` renvoie 201 et un corps conforme à `slotSchema`, avec `registeredCount` à 0                               |
| AS2      | `apps/api/src/modules/volunteers/domain/slot.spec.ts`                        | unitaire    | `Slot.create()` lève `SLOT_CAPACITY_INVALID` pour une capacité de 0 et `SLOT_ENDS_BEFORE_START` pour une fin égale au début |
| AS2      | `apps/api/test/slots.e2e.spec.ts`                                            | e2e         | 400 au format RFC 9457 qui nomme `capacity` ou `endsAt`, et aucun créneau créé                                              |
| AS3      | `apps/api/src/modules/volunteers/application/volunteers.application.spec.ts` | unitaire    | `OpenSlot` lève `SLOT_DISCIPLINE_NOT_FOUND`, et le repository reste vide                                                    |
| AS3      | `apps/api/test/slots.e2e.spec.ts`                                            | e2e         | 404 avec le code `SLOT_DISCIPLINE_NOT_FOUND`                                                                                |
| AS4      | `apps/api/src/modules/volunteers/application/volunteers.application.spec.ts` | unitaire    | l'inscription a le nom et l'email donnés, et le créneau compte 1 inscrit                                                    |
| AS4      | `apps/api/src/modules/volunteers/infra/drizzle-slot.repository.int.spec.ts`  | intégration | après `addRegistration()`, `findById()` relit le créneau avec `registeredCount` à 1                                         |
| AS5      | `apps/api/src/modules/volunteers/domain/slot.spec.ts`                        | unitaire    | `slot.register()` lève `SLOT_FULL` sur un créneau de capacité 2 qui a 2 inscrits                                            |
| AS5      | `apps/api/src/modules/volunteers/infra/drizzle-slot.repository.int.spec.ts`  | intégration | trois `addRegistration()` lancées en même temps sur un créneau de capacité 2 : deux passent, la troisième lève `SLOT_FULL`  |
| AS5      | `apps/api/test/slots.e2e.spec.ts`                                            | e2e         | la mesure du succès : deux inscriptions en 201, la troisième en 409 avec le code `SLOT_FULL`                                |
| AS6      | `apps/api/src/modules/volunteers/domain/registration.spec.ts`                | unitaire    | `Registration.create()` lève `REGISTRATION_NAME_REQUIRED` et `REGISTRATION_EMAIL_INVALID`                                   |
| AS6      | `apps/api/src/modules/volunteers/application/volunteers.application.spec.ts` | unitaire    | `RegisterVolunteer` lève `SLOT_NOT_FOUND` pour un créneau inconnu, sans rien enregistrer                                    |
| AS6      | `apps/api/test/slots.e2e.spec.ts`                                            | e2e         | 400 pour un nom vide ou un email mal formé, 404 avec `SLOT_NOT_FOUND` pour un créneau inconnu                               |

## 6. Tâches

Quatre tâches, dans l'ordre des couches ; chacune tient dans un commit.

- [x] T01 [001-AS2, AS5, AS6] Écrire d'abord `domain/slot.spec.ts` et `domain/registration.spec.ts` (« 001-AS2: rejects a capacity below 1 or an end not after the start », « 001-AS5: refuses a registration on a full slot », « 001-AS6: rejects an empty name or a malformed email »), puis `packages/shared/src/volunteers.ts`, `domain/slot.ts`, `domain/registration.ts` et `domain/volunteers.errors.ts`
- [x] T02 [001-AS1, AS3, AS4, AS6] Écrire d'abord `application/volunteers.application.spec.ts` (« 001-AS1: opens a slot with no registration », « 001-AS3: refuses a slot for an unknown discipline », « 001-AS4: registers a volunteer », « 001-AS6: refuses a registration on an unknown slot »), puis le port `SlotRepository`, le repository en mémoire, `OpenSlot` et `RegisterVolunteer`
- [x] T03 [001-AS4, AS5] Écrire d'abord `infra/drizzle-slot.repository.int.spec.ts` (« 001-AS4: reads back a slot with its registration count », « 001-AS5: lets only two of three concurrent registrations into a slot of capacity 2 »), puis `infra/volunteers.schema.ts`, la migration générée, les mappers et `DrizzleSlotRepository`
- [x] T04 [001-AS1, AS2, AS3, AS4, AS5, AS6] Écrire d'abord `apps/api/test/slots.e2e.spec.ts` (« 001-AS1: opens a slot (201) », « 001-AS5: accepts two volunteers and refuses the third (409 SLOT_FULL) », un test par autre scénario), puis `http/slots.controller.ts`, `volunteers.module.ts` et son ajout dans `app.module.ts`

## 7. Corrections

### Passage 1

Les écarts relevés par le relecteur lors de la première convergence. Chaque tâche cite le scénario concerné et la preuve.

- [x] T05 [001-AS2] Écrire d'abord dans `application/volunteers.application.spec.ts` le test « 001-AS2: stores no slot when the capacity or the times are invalid » (`OpenSlot` avec une capacité de 0, puis avec une fin égale au début, et `allSlots()` reste vide), puis corriger le code si le test échoue. Preuve : relecteur, le « Alors » de AS2 « aucun créneau n'est enregistré » n'est vérifié par aucun test (`apps/api/test/slots.e2e.spec.ts:49-59`, `domain/slot.spec.ts:33-46`).
- [x] T06 [001-AS6] Écrire d'abord dans `application/volunteers.application.spec.ts` le test « 001-AS6: stores no registration for an empty name or a malformed email » (`RegisterVolunteer` avec le nom `'  '`, puis avec un email mal formé, et `allRegistrations()` reste vide, `registeredCount` à 0), puis corriger le code si le test échoue. Preuve : relecteur, « aucune inscription n'est enregistrée » n'est vérifié que pour le créneau inconnu (`apps/api/test/slots.e2e.spec.ts:100-110`, `domain/registration.spec.ts:22-35`).
- [x] T07 [001-AS2] Écrire d'abord dans `apps/api/test/slots.e2e.spec.ts` le test « 001-AS2: rejects a capacity beyond the column range (400, names capacity) » (capacité 3000000000 → 400 `VALIDATION_FAILED` avec `errors[].path` à `capacity`), puis borner `capacity` à 2147483647 dans `packages/shared/src/volunteers.ts` et dans `Slot.create()` (`domain/slot.spec.ts`). Preuve : relecteur, la capacité 3000000000 passe Zod et le domaine puis l'insert échoue en `integer out of range` (22003), d'où une réponse 500 `INTERNAL_ERROR` (`packages/shared/src/volunteers.ts:11`, `infra/volunteers.schema.ts:17`).
- [x] T08 [001-AS6] Écrire d'abord dans `apps/api/test/slots.e2e.spec.ts` le test « 001-AS6: rejects an email longer than 254 characters (400, names email) », puis borner l'email à 254 caractères dans `registerVolunteerSchema` (`packages/shared/src/volunteers.ts`) et dans `Registration.create()` (`domain/registration.spec.ts`). Preuve : relecteur, un email de plus de 254 caractères passe Zod et le domaine puis l'insert échoue en `value too long for type character varying(254)` (22001), d'où une réponse 500 (`packages/shared/src/volunteers.ts:37`, `infra/volunteers.schema.ts:35`).

### Passage 2

L'écart relevé par le relecteur lors de la deuxième convergence.

- [ ] T09 [001-AS6] Écrire d'abord dans `apps/api/test/slots.e2e.spec.ts` le test « 001-AS6: rejects a name containing a NUL character (400, names name) » (nom `'Awa\u0000Diop'` → 400 `VALIDATION_FAILED` avec `errors[].path` à `name`), et dans `domain/registration.spec.ts` le même refus par `Registration.create()` (`REGISTRATION_NAME_REQUIRED` ou un code de validation du nom), puis refuser le caractère NUL dans `registerVolunteerSchema` (`packages/shared/src/volunteers.ts`) et dans `Registration.create()`. Preuve : relecteur, un nom avec un octet NUL passe Zod et le domaine puis l'insert échoue en `invalid byte sequence for encoding "UTF8": 0x00` (22021), d'où une réponse 500 `INTERNAL_ERROR` (`packages/shared/src/volunteers.ts:42`, `domain/registration.ts:64-70`, `core/errors/problem-details.filter.ts:78`).
