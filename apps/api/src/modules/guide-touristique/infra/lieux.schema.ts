import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const lieux = pgTable('lieux', {
  id: uuid('id').primaryKey(),
  nom: varchar('nom', { length: 150 }).notNull(),
  quartier: varchar('quartier', { length: 100 }).notNull(),
  // Le type est vérifié par le domaine (LIEU_TYPES).
  type: varchar('type', { length: 50 }).notNull(),
});

export type LieuRow = typeof lieux.$inferSelect;
