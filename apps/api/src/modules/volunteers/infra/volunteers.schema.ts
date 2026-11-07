// Lu par drizzle-kit pour générer les migrations : ce fichier n'importe que drizzle-orm et des schémas.
import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { disciplines } from '../../disciplines/infra/disciplines.schema';

export const slots = pgTable(
  'slots',
  {
    id: uuid('id').primaryKey(),
    // Supprimer une discipline supprime ses créneaux, et leurs inscriptions par cascade.
    disciplineId: uuid('discipline_id')
      .notNull()
      .references(() => disciplines.id, { onDelete: 'cascade' }),
    // Précision milliseconde = celle de Date en JavaScript.
    startsAt: timestamp('starts_at', { withTimezone: true, precision: 3 }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true, precision: 3 }).notNull(),
    capacity: integer('capacity').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
  },
  (table) => [
    // Les mêmes règles que Slot.create(), gardées aussi par la base.
    check('slots_capacity_check', sql`${table.capacity} >= 1`),
    check('slots_ends_after_start_check', sql`${table.endsAt} > ${table.startsAt}`),
  ],
);

export const registrations = pgTable(
  'registrations',
  {
    id: uuid('id').primaryKey(),
    slotId: uuid('slot_id')
      .notNull()
      .references(() => slots.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 254 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
  },
  // La capacité n'est pas une contrainte : DrizzleSlotRepository la vérifie sous verrou.
  (table) => [index('registrations_slot_id_idx').on(table.slotId)],
);

export type SlotRow = typeof slots.$inferSelect;
export type RegistrationRow = typeof registrations.$inferSelect;
