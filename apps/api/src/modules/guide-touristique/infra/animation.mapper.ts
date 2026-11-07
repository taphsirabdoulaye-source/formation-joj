import { lieuTypeSchema } from '@joj/shared';
import { Animation } from '../domain/animation';
import { Lieu } from '../domain/lieu';
import type { AnimationRow } from './animations.schema';
import type { LieuRow } from './lieux.schema';

/** Ligne de la table lieux → entité Lieu. Un type inconnu en base est un bug : on échoue tôt. */
export function lieuToDomain(row: LieuRow): Lieu {
  return Lieu.restore({
    id: row.id,
    nom: row.nom,
    quartier: row.quartier,
    type: lieuTypeSchema.parse(row.type),
  });
}

/** Entité Lieu → ligne de la table. */
export function lieuToRow(lieu: Lieu): LieuRow {
  return {
    id: lieu.id,
    nom: lieu.nom,
    quartier: lieu.quartier,
    type: lieu.type,
  };
}

/** Ligne de la table animations (avec le lieu joint) → entité Animation. */
export function animationToDomain(row: AnimationRow, lieu: Lieu): Animation {
  return Animation.restore({
    id: row.id,
    nom: row.nom,
    // PostgreSQL `date` → string YYYY-MM-DD
    date: row.date,
    // PostgreSQL `time` peut renvoyer "HH:MM:SS" — on ne garde que HH:MM
    heureDebut: row.heureDebut.slice(0, 5),
    heureFin: row.heureFin.slice(0, 5),
    lieu,
  });
}

/** Entité Animation → ligne de la table. */
export function animationToRow(animation: Animation): AnimationRow {
  return {
    id: animation.id,
    nom: animation.nom,
    date: animation.date,
    heureDebut: animation.heureDebut,
    heureFin: animation.heureFin,
    lieuId: animation.lieu.id,
  };
}
