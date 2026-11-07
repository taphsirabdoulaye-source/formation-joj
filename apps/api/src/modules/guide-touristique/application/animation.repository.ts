import type { Animation } from '../domain/animation';
import type { Lieu } from '../domain/lieu';

/**
 * Port de persistance : ce dont les cas d'usage ont besoin, rien de plus.
 * Implémenté par DrizzleAnimationRepository (infra) et InMemoryAnimationRepository (tests).
 */
export abstract class AnimationRepository {
  /** Toutes les animations d'une date YYYY-MM-DD, triées par heureDebut. */
  abstract listByDate(date: string): Promise<Animation[]>;
  /** Trouve un lieu par son identifiant. */
  abstract findLieuById(id: string): Promise<Lieu | null>;
  /** Insère une nouvelle animation. */
  abstract insert(animation: Animation): Promise<void>;
}
