import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { disciplines } from '../../disciplines/infra/disciplines.schema';
import { SlotRepository } from '../application/slot.repository';
import type { Registration } from '../domain/registration';
import type { Slot } from '../domain/slot';
import { slotFull, slotNotFound } from '../domain/volunteers.errors';
import * as registrationMapper from './registration.mapper';
import * as slotMapper from './slot.mapper';
import { registrations, slots } from './volunteers.schema';

@Injectable()
export class DrizzleSlotRepository extends SlotRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async disciplineExists(disciplineId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: disciplines.id })
      .from(disciplines)
      .where(eq(disciplines.id, disciplineId))
      .limit(1);
    return row !== undefined;
  }

  async findById(id: string): Promise<Slot | null> {
    const [row] = await this.db
      .select({ slot: slots, registeredCount: count(registrations.id) })
      .from(slots)
      .leftJoin(registrations, eq(registrations.slotId, slots.id))
      .where(eq(slots.id, id))
      .groupBy(slots.id);
    return row ? slotMapper.toDomain(row.slot, row.registeredCount) : null;
  }

  async insert(slot: Slot): Promise<void> {
    await this.db.insert(slots).values(slotMapper.toRow(slot));
  }

  async addRegistration(registration: Registration): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Le verrou sur la ligne du créneau fait attendre les autres inscriptions au même créneau :
      // le comptage qui suit ne peut pas être dépassé par une inscription concurrente.
      const [slot] = await tx
        .select({ capacity: slots.capacity })
        .from(slots)
        .where(eq(slots.id, registration.slotId))
        .for('update');
      if (!slot) throw slotNotFound(registration.slotId);

      const [registered] = await tx
        .select({ value: count() })
        .from(registrations)
        .where(eq(registrations.slotId, registration.slotId));
      if ((registered?.value ?? 0) >= slot.capacity) {
        throw slotFull(registration.slotId, slot.capacity);
      }

      await tx.insert(registrations).values(registrationMapper.toRow(registration));
    });
  }
}
