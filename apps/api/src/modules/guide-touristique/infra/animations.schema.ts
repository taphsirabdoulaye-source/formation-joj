import { date, pgTable, time, uuid, varchar } from 'drizzle-orm/pg-core';
import { lieux } from './lieux.schema';

export const animations = pgTable('animations', {
  id: uuid('id').primaryKey(),
  nom: varchar('nom', { length: 150 }).notNull(),
  // Format YYYY-MM-DD — stocké comme `date` PostgreSQL (sans heure).
  date: date('date').notNull(),
  // Format HH:MM — stocké comme `time` PostgreSQL sans timezone.
  heureDebut: time('heure_debut').notNull(),
  heureFin: time('heure_fin').notNull(),
  lieuId: uuid('lieu_id')
    .notNull()
    .references(() => lieux.id),
});

export type AnimationRow = typeof animations.$inferSelect;
