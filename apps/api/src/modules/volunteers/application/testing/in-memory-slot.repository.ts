import { Registration } from '../../domain/registration';
import { Slot } from '../../domain/slot';
import { slotFull, slotNotFound } from '../../domain/volunteers.errors';
import { SlotRepository } from '../slot.repository';

/**
 * Fake fidèle au contrat du port (disciplines connues, capacité revérifiée à l'écriture, nombre
 * d'inscrits compté), pour tester l'application sans base.
 */
export class InMemorySlotRepository extends SlotRepository {
  private readonly disciplineIds: ReadonlySet<string>;
  private readonly slots = new Map<string, Slot>();
  private readonly registrations: Registration[] = [];

  /** Les disciplines qui existent, comme la table `disciplines` en base. */
  constructor(disciplineIds: readonly string[] = []) {
    super();
    this.disciplineIds = new Set(disciplineIds);
  }

  async disciplineExists(disciplineId: string): Promise<boolean> {
    return this.disciplineIds.has(disciplineId);
  }

  async findById(id: string): Promise<Slot | null> {
    const found = this.slots.get(id);
    return found ? this.withCount(found) : null;
  }

  async insert(slot: Slot): Promise<void> {
    this.slots.set(slot.id, this.withCount(slot));
  }

  async addRegistration(registration: Registration): Promise<void> {
    const slot = this.slots.get(registration.slotId);
    if (!slot) throw slotNotFound(registration.slotId);
    if (this.countOf(slot.id) >= slot.capacity) throw slotFull(slot.id, slot.capacity);
    this.registrations.push(Registration.restore(registrationProps(registration)));
  }

  /** Pour les tests : vérifier que rien n'a été enregistré. */
  allSlots(): Slot[] {
    return [...this.slots.values()].map((slot) => this.withCount(slot));
  }

  allRegistrations(): Registration[] {
    return this.registrations.map((registration) =>
      Registration.restore(registrationProps(registration)),
    );
  }

  private countOf(slotId: string): number {
    return this.registrations.filter((registration) => registration.slotId === slotId).length;
  }

  /** Copie avec le nombre d'inscrits compté, comme le fait la base à la lecture. */
  private withCount(slot: Slot): Slot {
    return Slot.restore({
      id: slot.id,
      disciplineId: slot.disciplineId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      capacity: slot.capacity,
      registeredCount: this.countOf(slot.id),
      createdAt: slot.createdAt,
    });
  }
}

function registrationProps(registration: Registration) {
  return {
    id: registration.id,
    slotId: registration.slotId,
    name: registration.name,
    email: registration.email,
    createdAt: registration.createdAt,
  };
}
