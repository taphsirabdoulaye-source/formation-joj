import type { Registration } from '../domain/registration';
import type { Slot } from '../domain/slot';

/**
 * Port de persistance : ce dont les cas d'usage ont besoin, rien de plus.
 * Implémenté par DrizzleSlotRepository (infra) et InMemorySlotRepository (tests).
 */
export abstract class SlotRepository {
  abstract disciplineExists(disciplineId: string): Promise<boolean>;
  /** Le créneau avec son nombre d'inscrits, ou null. */
  abstract findById(id: string): Promise<Slot | null>;
  abstract insert(slot: Slot): Promise<void>;
  /**
   * Enregistre l'inscription en revérifiant la capacité de façon atomique : lève SLOT_FULL si le
   * créneau s'est rempli entre la lecture et l'écriture, SLOT_NOT_FOUND s'il n'existe plus.
   */
  abstract addRegistration(registration: Registration): Promise<void>;
}
