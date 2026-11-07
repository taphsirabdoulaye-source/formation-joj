import { ANIMATION_NOM_MAX_LENGTH, JEUX_DATE_DEBUT, JEUX_DATE_FIN } from '@joj/shared';
import {
  animationFinBeforeDebut,
  animationOutsideGamesPeriod,
  GuideTouristiqueError,
} from './guide-touristique.errors';
import type { Lieu } from './lieu';

export interface AnimationProps {
  id: string;
  nom: string;
  /** Format YYYY-MM-DD. */
  date: string;
  /** Format HH:MM. */
  heureDebut: string;
  /** Format HH:MM. */
  heureFin: string;
  lieu: Lieu;
}

export interface NewAnimation {
  id: string;
  nom: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  lieu: Lieu;
}

/** Une animation culturelle pendant les JOJ : un nom, une date, un créneau horaire, un lieu. */
export class Animation {
  private constructor(private props: AnimationProps) {}

  static create({ id, nom, date, heureDebut, heureFin, lieu }: NewAnimation): Animation {
    return new Animation({
      id,
      nom: validNom(nom),
      date: validDate(date),
      heureDebut: validHeure(heureDebut, 'heureDebut'),
      heureFin: validHeureFin(heureDebut, heureFin),
      lieu,
    });
  }

  /** Reconstruit une animation depuis la persistance, sans rejouer les règles de création. */
  static restore(props: AnimationProps): Animation {
    return new Animation({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get nom(): string {
    return this.props.nom;
  }

  get date(): string {
    return this.props.date;
  }

  get heureDebut(): string {
    return this.props.heureDebut;
  }

  get heureFin(): string {
    return this.props.heureFin;
  }

  get lieu(): Lieu {
    return this.props.lieu;
  }

  /**
   * Vrai si l'heure donnée tombe dans le créneau : [heureDebut, heureFin[
   * L'heure est au format HH:MM.
   */
  isEnCours(heure: string): boolean {
    return heure >= this.props.heureDebut && heure < this.props.heureFin;
  }
}

function validNom(nom: string): string {
  const trimmed = nom.trim();
  if (trimmed.length === 0) {
    throw new GuideTouristiqueError('ANIMATION_NOM_REQUIRED', 'An animation needs a name');
  }
  if (trimmed.length > ANIMATION_NOM_MAX_LENGTH) {
    throw new GuideTouristiqueError(
      'ANIMATION_NOM_TOO_LONG',
      `An animation name has at most ${ANIMATION_NOM_MAX_LENGTH} characters`,
    );
  }
  return trimmed;
}

function validDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new GuideTouristiqueError(
      'ANIMATION_INVALID_DATE',
      `Invalid date format: ${date}. Expected YYYY-MM-DD`,
      { date },
    );
  }
  if (date < JEUX_DATE_DEBUT || date > JEUX_DATE_FIN) {
    throw animationOutsideGamesPeriod(date);
  }
  return date;
}

function validHeure(heure: string, field: string): string {
  if (!/^\d{2}:\d{2}$/.test(heure)) {
    throw new GuideTouristiqueError(
      'ANIMATION_INVALID_DATE',
      `Invalid time format for ${field}: ${heure}. Expected HH:MM`,
      { field, heure },
    );
  }
  return heure;
}

function validHeureFin(heureDebut: string, heureFin: string): string {
  validHeure(heureFin, 'heureFin');
  if (heureFin <= heureDebut) {
    throw animationFinBeforeDebut(heureDebut, heureFin);
  }
  return heureFin;
}
