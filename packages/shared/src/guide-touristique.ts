import { z } from 'zod';

/** Types de lieux du guide touristique. */
export const LIEU_TYPES = [
  'musee',
  'marche',
  'plage',
  'monument',
  'quartier',
  'restaurant',
  'sport',
] as const;

export const lieuTypeSchema = z.enum(LIEU_TYPES);
export type LieuType = z.infer<typeof lieuTypeSchema>;

export const ANIMATION_NOM_MAX_LENGTH = 150;

/** Les JOJ Dakar 2026 : du 31 octobre au 13 novembre 2026. */
export const JEUX_DATE_DEBUT = '2026-10-31';
export const JEUX_DATE_FIN = '2026-11-13';

/** Un lieu tel que l'API le renvoie. */
export const lieuSchema = z.object({
  id: z.uuid(),
  nom: z.string(),
  quartier: z.string(),
  type: lieuTypeSchema,
});
export type LieuResponse = z.infer<typeof lieuSchema>;

export const lieuListSchema = z.array(lieuSchema);

/**
 * Paramètre `:date` des routes du guide : une date ISO `YYYY-MM-DD` qui existe au calendrier.
 * Une date impossible (2026-13-45) est refusée ici, avant d'atteindre la base.
 */
export const dateParamsSchema = z.object({
  date: z.iso.date({ message: 'Expected an existing date YYYY-MM-DD' }),
});

/** Paramètre `?at=` pour les animations en cours : une date-heure ISO 8601. */
export const atQuerySchema = z.object({
  at: z.iso.datetime({ offset: true }).or(z.iso.datetime()),
});

/** Une animation telle que l'API la renvoie. */
export const animationSchema = z.object({
  id: z.uuid(),
  nom: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heureDebut: z.string().regex(/^\d{2}:\d{2}$/),
  heureFin: z.string().regex(/^\d{2}:\d{2}$/),
  lieu: lieuSchema,
});
export type AnimationResponse = z.infer<typeof animationSchema>;

export const animationListSchema = z.array(animationSchema);
