import { Injectable } from '@nestjs/common';
import type { Animation } from '../../domain/animation';
import { AnimationRepository } from '../animation.repository';

@Injectable()
export class GetAnimationsEnCours {
  constructor(private readonly animations: AnimationRepository) {}

  /**
   * Renvoie les animations en cours à un instant donné.
   * @param dateHeure - Date-heure ISO 8601, avec ou sans décalage (ex: "2026-11-01T10:30:00Z")
   */
  async execute(dateHeure: string): Promise<Animation[]> {
    // Dakar est à UTC+0 sans heure d'été : l'instant ramené à UTC donne la date et l'heure locales.
    const dakar = new Date(dateHeure).toISOString();
    const date = dakar.slice(0, 10); // YYYY-MM-DD
    const heure = dakar.slice(11, 16); // HH:MM
    const animationsDuJour = await this.animations.listByDate(date);
    return animationsDuJour.filter((animation) => animation.isEnCours(heure));
  }
}
