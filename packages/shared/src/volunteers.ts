import { z } from 'zod';

export const REGISTRATION_NAME_MAX_LENGTH = 100;

/** Le plus grand entier d'une colonne `integer` Postgres : au-delà, la base refuserait le créneau. */
export const SLOT_CAPACITY_MAX = 2_147_483_647;

/** Corps de `POST /api/slots`. */
export const openSlotSchema = z
  .object({
    disciplineId: z.uuid(),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    capacity: z.int().min(1).max(SLOT_CAPACITY_MAX),
  })
  .refine((input) => Date.parse(input.endsAt) > Date.parse(input.startsAt), {
    message: 'The end must be after the start',
    path: ['endsAt'],
  });
export type OpenSlotInput = z.infer<typeof openSlotSchema>;

/** Paramètre `:id` des routes d'un créneau. */
export const slotIdParamsSchema = z.object({ id: z.uuid() });

/** Un créneau tel que l'API le renvoie, avec son nombre d'inscrits. */
export const slotSchema = z.object({
  id: z.uuid(),
  disciplineId: z.uuid(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  capacity: z.int().min(1),
  registeredCount: z.int().min(0),
  createdAt: z.iso.datetime(),
});
export type SlotResponse = z.infer<typeof slotSchema>;

/** Corps de `POST /api/slots/:id/registrations`. */
export const registerVolunteerSchema = z.object({
  name: z.string().trim().min(1).max(REGISTRATION_NAME_MAX_LENGTH),
  email: z.email(),
});
export type RegisterVolunteerInput = z.infer<typeof registerVolunteerSchema>;

/** Une inscription telle que l'API la renvoie. */
export const registrationSchema = z.object({
  id: z.uuid(),
  slotId: z.uuid(),
  name: z.string(),
  email: z.email(),
  createdAt: z.iso.datetime(),
});
export type RegistrationResponse = z.infer<typeof registrationSchema>;
