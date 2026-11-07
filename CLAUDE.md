# CLAUDE.md

Application d'organisation des JOJ Dakar 2026 : une API NestJS (`apps/api`), un front React (`apps/web`) et des schémas partagés (`packages/shared`), dans un monorepo pnpm. Commandes et structure détaillée : `README.md`.

## Méthodologie

- Toute fonctionnalité suit le cycle `/prd` → `/spec` → `/spec-plan` → `/tdd-task` → `/converge` ; les principes sont dans `specs/constitution.md`.
- Test d'abord : écrire le test, le voir échouer pour la bonne raison (`pnpm tdd:red <fichier>`), puis le code minimal.
- `pnpm verify` sur les fichiers modifiés pendant le travail, `pnpm check` avant de conclure.
- Une tâche = un commit Conventional Commits ; jamais de `--no-verify` (le pré-commit lance `pnpm verify --staged`).
- Celui qui produit ne valide pas : le sous-agent `relecteur` relit avant de conclure une fonctionnalité.
- Une nouvelle fonctionnalité suit l'ordre de construction du `README.md`, du schéma partagé à l'écran.

## Architecture

- `packages/shared` : le contrat entre l'API et le front (schémas Zod et types inférés). Il ne dépend que de `zod` et n'importe jamais `apps/*`.
- `apps/api` et `apps/web` importent `@joj/shared`, jamais l'un l'autre : ils ne se parlent qu'en HTTP.
- API : un module par domaine dans `apps/api/src/modules/<domaine>/`, sur le modèle de `disciplines` :
  - `domain/` : entités et règles, TypeScript pur, sans NestJS, Drizzle ni `pg` (le lint le vérifie) ;
  - `application/` : le port `<entité>.repository.ts` (classe abstraite), un cas d'usage par fichier dans `use-cases/`, le repository en mémoire dans `testing/` ;
  - `infra/` : table Drizzle, mapper `toDomain()`/`toRow()`, repository Drizzle ;
  - `http/` : un controller fin, qui ne fait que valider, appeler un cas d'usage et sérialiser ;
  - `<domaine>.module.ts` relie le port à son implémentation, puis il est ajouté à `src/app.module.ts`.
- Le transverse de l'API (config, base, erreurs, santé) est dans `apps/api/src/core/`.
- Front : `src/routes/` (un fichier par route TanStack Router), `src/features/<nom>/api/` (appels HTTP et hooks TanStack Query), `src/features/<nom>/components/`, `src/components/ui/` (shadcn), `src/lib/api/` (client HTTP typé).
- `apps/web/src/mocks/` est la fausse API MSW des tests du front : elle respecte le même contrat que `apps/api` (mêmes schémas, mêmes codes d'erreur).

## Concepts appréciés

- Typage strict (`strict`, `noUncheckedIndexedAccess`), pas de `any` : les types viennent de `z.infer` dans `packages/shared`.
- Un cas d'usage = une classe `@Injectable()` avec une seule méthode `execute()`.
- Les objets du domaine sont créés par `Entity.create()`, qui applique les règles, et relus par `Entity.restore()`.
- Les cas d'usage dépendent du port abstrait, jamais de l'implémentation Drizzle.
- Côté front, `<nom>.api.ts` ne contient que les appels HTTP (réponse validée par le schéma partagé) ; le cache et les hooks vont dans `<nom>.queries.ts`.
- Des commentaires courts en français qui expliquent le pourquoi, pas le quoi.

## Bonnes pratiques

- Toute erreur métier est une `AppError` de catégorie VALIDATION, NOT_FOUND, CONFLICT ou BUSINESS_RULE, avec un code stable (voir `domain/disciplines.errors.ts`). Seul `ProblemDetailsFilter` la transforme en réponse HTTP (400, 404, 409 ou 422, au format RFC 9457).
- Les entrées sont validées par un schéma Zod de `packages/shared` via `createZodDto` ; les réponses sont sérialisées avec `@ZodSerializerDto`. Jamais de validation à la main dans un controller.
- La configuration passe par `AppConfig.fromEnv` ; aucun secret dans le code (un hook bloque les écritures qui en contiennent).
- Les migrations sont générées par `pnpm db:generate --name=<sujet>`, jamais éditées à la main.
- Tests, tous sans Docker ni réseau : domaine et cas d'usage avec le repository en mémoire, repository Drizzle en `*.int.spec.ts` sur PGlite, e2e de l'API avec supertest dans `apps/api/test/`, front avec Testing Library et MSW, et un audit d'accessibilité `*.a11y.test.tsx` par route.

## Nommage

- Fichiers en kebab-case, suffixés par leur rôle : `create-discipline.ts`, `discipline.mapper.ts`, `drizzle-discipline.repository.ts`, `disciplines.schema.ts`, `disciplines.controller.ts`.
- Tests : `*.spec.ts` dans l'API, `*.int.spec.ts` pour l'intégration, `*.e2e.spec.ts` pour les e2e, `*.test.ts(x)` dans le front.
- Classes en PascalCase, cas d'usage nommés par un verbe : `CreateDiscipline`, `ListDisciplines`.
- Codes d'erreur en SCREAMING_SNAKE_CASE, préfixés par le domaine : `DISCIPLINE_NAME_TAKEN`.
- Schémas Zod en camelCase suffixés par `Schema` (`createDisciplineSchema`), types inférés en PascalCase (`CreateDisciplineInput`).
- Titres de tests en anglais, préfixés par l'identifiant du scénario quand il y en a un : `it('001-AS2: rejects a full slot')`.
- Commits : `feat(benevoles): T03 refuse a full slot (001-AS2)`.
