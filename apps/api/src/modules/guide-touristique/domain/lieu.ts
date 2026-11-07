import { LIEU_TYPES, type LieuType } from '@joj/shared';
import { GuideTouristiqueError } from './guide-touristique.errors';

export interface LieuProps {
  id: string;
  nom: string;
  quartier: string;
  type: LieuType;
}

export interface NewLieu {
  id: string;
  nom: string;
  quartier: string;
  /** Vérifiée ici : le domaine ne fait pas confiance à la validation HTTP. */
  type: string;
}

/** Un lieu touristique de Dakar : un nom, un quartier, un type parmi la liste fermée. */
export class Lieu {
  private constructor(private props: LieuProps) {}

  static create({ id, nom, quartier, type }: NewLieu): Lieu {
    return new Lieu({
      id,
      nom: validNom(nom),
      quartier: validQuartier(quartier),
      type: validType(type),
    });
  }

  /** Reconstruit un lieu depuis la persistance, sans rejouer les règles de création. */
  static restore(props: LieuProps): Lieu {
    return new Lieu({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get nom(): string {
    return this.props.nom;
  }

  get quartier(): string {
    return this.props.quartier;
  }

  get type(): LieuType {
    return this.props.type;
  }
}

function validNom(nom: string): string {
  const trimmed = nom.trim();
  if (trimmed.length === 0) {
    throw new GuideTouristiqueError('LIEU_NOM_REQUIRED', 'A location needs a name');
  }
  return trimmed;
}

function validQuartier(quartier: string): string {
  const trimmed = quartier.trim();
  if (trimmed.length === 0) {
    throw new GuideTouristiqueError('LIEU_QUARTIER_REQUIRED', 'A location needs a neighbourhood');
  }
  return trimmed;
}

function validType(type: string): LieuType {
  if (!(LIEU_TYPES as readonly string[]).includes(type)) {
    throw new GuideTouristiqueError('LIEU_TYPE_UNKNOWN', `Unknown type ${type}`, {
      type,
      allowed: LIEU_TYPES,
    });
  }
  return type as LieuType;
}
