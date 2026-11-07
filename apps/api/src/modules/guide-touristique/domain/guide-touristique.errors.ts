import { AppError, type ErrorKind } from '../../../core/errors/app-error';

/** Codes stables exposés aux clients ; la catégorie décide du statut HTTP. */
const GUIDE_ERROR_KINDS = {
  /** Nom de lieu vide. */
  LIEU_NOM_REQUIRED: 'VALIDATION',
  /** Quartier de lieu vide. */
  LIEU_QUARTIER_REQUIRED: 'VALIDATION',
  /** Type de lieu absent de LIEU_TYPES. */
  LIEU_TYPE_UNKNOWN: 'VALIDATION',
  /** Nom d'animation vide. */
  ANIMATION_NOM_REQUIRED: 'VALIDATION',
  /** Nom d'animation trop long. */
  ANIMATION_NOM_TOO_LONG: 'VALIDATION',
  /** Heure de fin identique ou antérieure à l'heure de début. */
  ANIMATION_FIN_BEFORE_DEBUT: 'VALIDATION',
  /** Date hors de la période des JOJ (31 oct – 13 nov 2026). */
  ANIMATION_OUTSIDE_GAMES_PERIOD: 'BUSINESS_RULE',
  /** Date au mauvais format. */
  ANIMATION_INVALID_DATE: 'VALIDATION',
  /** Aucune animation n'a cet identifiant. */
  ANIMATION_NOT_FOUND: 'NOT_FOUND',
  /** Aucun lieu n'a cet identifiant. */
  LIEU_NOT_FOUND: 'NOT_FOUND',
} as const satisfies Record<string, ErrorKind>;

export type GuideTouristiqueErrorCode = keyof typeof GUIDE_ERROR_KINDS;

export class GuideTouristiqueError extends AppError<GuideTouristiqueErrorCode> {
  constructor(code: GuideTouristiqueErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, GUIDE_ERROR_KINDS[code], message, details);
  }
}

export function animationNotFound(id: string): GuideTouristiqueError {
  return new GuideTouristiqueError('ANIMATION_NOT_FOUND', `No animation with id ${id}`, { id });
}

export function lieuNotFound(id: string): GuideTouristiqueError {
  return new GuideTouristiqueError('LIEU_NOT_FOUND', `No location with id ${id}`, { id });
}

export function animationOutsideGamesPeriod(date: string): GuideTouristiqueError {
  return new GuideTouristiqueError(
    'ANIMATION_OUTSIDE_GAMES_PERIOD',
    `Date ${date} is outside the JOJ period (2026-10-31 to 2026-11-13)`,
    { date },
  );
}

export function animationFinBeforeDebut(
  heureDebut: string,
  heureFin: string,
): GuideTouristiqueError {
  return new GuideTouristiqueError(
    'ANIMATION_FIN_BEFORE_DEBUT',
    `End time ${heureFin} must be after start time ${heureDebut}`,
    { heureDebut, heureFin },
  );
}
