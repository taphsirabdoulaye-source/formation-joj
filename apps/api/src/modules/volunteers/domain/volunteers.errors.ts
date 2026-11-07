import { AppError, type ErrorKind } from '../../../core/errors/app-error';

/** Codes stables exposés aux clients ; la catégorie décide du statut HTTP. */
const VOLUNTEER_ERROR_KINDS = {
  /** Capacité qui n'est pas un entier d'au moins 1. */
  SLOT_CAPACITY_INVALID: 'VALIDATION',
  /** Fin égale au début ou avant lui. */
  SLOT_ENDS_BEFORE_START: 'VALIDATION',
  /** Aucune discipline n'a l'identifiant donné à l'ouverture du créneau. */
  SLOT_DISCIPLINE_NOT_FOUND: 'NOT_FOUND',
  /** Aucun créneau n'a cet identifiant. */
  SLOT_NOT_FOUND: 'NOT_FOUND',
  /** Le créneau a déjà autant d'inscrits que sa capacité. */
  SLOT_FULL: 'CONFLICT',
  /** Nom vide, ou fait seulement d'espaces. */
  REGISTRATION_NAME_REQUIRED: 'VALIDATION',
  REGISTRATION_EMAIL_INVALID: 'VALIDATION',
} as const satisfies Record<string, ErrorKind>;

export type VolunteerErrorCode = keyof typeof VOLUNTEER_ERROR_KINDS;

export class VolunteerError extends AppError<VolunteerErrorCode> {
  constructor(code: VolunteerErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, VOLUNTEER_ERROR_KINDS[code], message, details);
  }
}

export function slotFull(slotId: string, capacity: number): VolunteerError {
  return new VolunteerError('SLOT_FULL', `Slot ${slotId} is full (${capacity} volunteers)`, {
    slotId,
    capacity,
  });
}

export function slotNotFound(id: string): VolunteerError {
  return new VolunteerError('SLOT_NOT_FOUND', `No slot with id ${id}`, { id });
}

export function slotDisciplineNotFound(disciplineId: string): VolunteerError {
  return new VolunteerError('SLOT_DISCIPLINE_NOT_FOUND', `No discipline with id ${disciplineId}`, {
    disciplineId,
  });
}
