import { Animation } from '../../domain/animation';
import type { Lieu } from '../../domain/lieu';
import { AnimationRepository } from '../animation.repository';

/** Fake fidèle au contrat du port, pour tester l'application sans base. */
export class InMemoryAnimationRepository extends AnimationRepository {
  private readonly animations = new Map<string, Animation>();
  private readonly lieux = new Map<string, Lieu>();

  /** Pré-charge des lieux pour les tests sans passer par la base. */
  seedLieux(lieux: Lieu[]): void {
    for (const lieu of lieux) {
      this.lieux.set(lieu.id, lieu);
    }
  }

  async listByDate(date: string): Promise<Animation[]> {
    return [...this.animations.values()]
      .filter((a) => a.date === date)
      .sort((a, b) => (a.heureDebut < b.heureDebut ? -1 : a.heureDebut > b.heureDebut ? 1 : 0))
      .map(clone);
  }

  async findLieuById(id: string): Promise<Lieu | null> {
    return this.lieux.get(id) ?? null;
  }

  async insert(animation: Animation): Promise<void> {
    this.animations.set(animation.id, clone(animation));
  }
}

/** Copie : un test ne voit pas une modification qui n'a pas été persistée. */
function clone(animation: Animation): Animation {
  return Animation.restore({
    id: animation.id,
    nom: animation.nom,
    date: animation.date,
    heureDebut: animation.heureDebut,
    heureFin: animation.heureFin,
    lieu: animation.lieu,
  });
}
