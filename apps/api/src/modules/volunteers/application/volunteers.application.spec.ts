import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { InMemorySlotRepository } from './testing/in-memory-slot.repository';
import { OpenSlot } from './use-cases/open-slot';
import { RegisterVolunteer } from './use-cases/register-volunteer';

const LUTTE = '0199f5c2-0000-7000-8000-000000000001';

function setup() {
  const slots = new InMemorySlotRepository([LUTTE]);
  return { slots, openSlot: new OpenSlot(slots), registerVolunteer: new RegisterVolunteer(slots) };
}

const morning = (capacity = 2, disciplineId = LUTTE) => ({
  disciplineId,
  startsAt: '2026-11-01T09:00:00.000Z',
  endsAt: '2026-11-01T12:00:00.000Z',
  capacity,
});

describe('volunteers (application layer)', () => {
  it('001-AS1: opens a slot with no registration and stores it', async () => {
    const { slots, openSlot } = setup();
    const slot = await openSlot.execute(morning());

    expect(slot).toMatchObject({
      disciplineId: LUTTE,
      startsAt: new Date('2026-11-01T09:00:00.000Z'),
      endsAt: new Date('2026-11-01T12:00:00.000Z'),
      capacity: 2,
      registeredCount: 0,
    });
    expect(await slots.findById(slot.id)).toEqual(slot);
  });

  it('001-AS3: refuses a slot for an unknown discipline', async () => {
    const { slots, openSlot } = setup();

    await expect(openSlot.execute(morning(2, randomUUID()))).rejects.toMatchObject({
      code: 'SLOT_DISCIPLINE_NOT_FOUND',
    });
    expect(slots.allSlots()).toEqual([]);
  });

  it('001-AS4: registers a volunteer and counts one registration', async () => {
    const { slots, openSlot, registerVolunteer } = setup();
    const slot = await openSlot.execute(morning());

    const registration = await registerVolunteer.execute(slot.id, {
      name: 'Awa Diop',
      email: 'awa.diop@example.com',
    });

    expect(registration).toMatchObject({
      slotId: slot.id,
      name: 'Awa Diop',
      email: 'awa.diop@example.com',
    });
    expect((await slots.findById(slot.id))?.registeredCount).toBe(1);
  });

  it('001-AS5: refuses a third volunteer on a slot of capacity 2', async () => {
    const { slots, openSlot, registerVolunteer } = setup();
    const slot = await openSlot.execute(morning(2));
    await registerVolunteer.execute(slot.id, { name: 'Awa', email: 'awa@example.com' });
    await registerVolunteer.execute(slot.id, { name: 'Moussa', email: 'moussa@example.com' });

    await expect(
      registerVolunteer.execute(slot.id, { name: 'Fatou', email: 'fatou@example.com' }),
    ).rejects.toMatchObject({ code: 'SLOT_FULL' });
    expect((await slots.findById(slot.id))?.registeredCount).toBe(2);
  });

  it('001-AS6: refuses a registration on an unknown slot', async () => {
    const { slots, registerVolunteer } = setup();

    await expect(
      registerVolunteer.execute(randomUUID(), { name: 'Awa Diop', email: 'awa.diop@example.com' }),
    ).rejects.toMatchObject({ code: 'SLOT_NOT_FOUND' });
    expect(slots.allRegistrations()).toEqual([]);
  });
});
