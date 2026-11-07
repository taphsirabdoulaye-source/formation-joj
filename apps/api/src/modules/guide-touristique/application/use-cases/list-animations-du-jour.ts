import { Injectable } from '@nestjs/common';
import type { Animation } from '../../domain/animation';
import { AnimationRepository } from '../animation.repository';

@Injectable()
export class ListAnimationsDuJour {
  constructor(private readonly animations: AnimationRepository) {}

  /** Renvoie toutes les animations d'une date YYYY-MM-DD, triées par heureDebut. */
  execute(date: string): Promise<Animation[]> {
    return this.animations.listByDate(date);
  }
}
