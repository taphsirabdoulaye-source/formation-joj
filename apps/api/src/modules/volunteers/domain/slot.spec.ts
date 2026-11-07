import { describe, expect, it } from 'vitest';
import { Slot } from './slot';

const NOW = new Date('2026-10-31T09:00:00.000Z');
const SLOT_ID = '0199f5c2-0000-7000-8000-000000000101';
const DISCIPLINE_ID = '0199f5c2-0000-7000-8000-000000000001';
const STARTS_AT = new Date('2026-11-01T09:00:00.000Z');
const ENDS_AT = new Date('2026-11-01T12:00:00.000Z');

const openSlot = (capacity = 2, startsAt = STARTS_AT, endsAt = ENDS_AT) =>
  Slot.create({ id: SLOT_ID, disciplineId: DISCIPLINE_ID, startsAt, endsAt, capacity, now: NOW });

const volunteer = (n: number) => ({
  id: `0199f5c2-0000-7000-8000-00000000020${n}`,
  name: `Bénévole ${n}`,
  email: `benevole${n}@example.com`,
  now: NOW,
});

describe('Slot', () => {
  it('001-AS1: opens a slot with its discipline, times, capacity and no registration', () => {
    expect(openSlot()).toMatchObject({
      id: SLOT_ID,
      disciplineId: DISCIPLINE_ID,
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      capacity: 2,
      registeredCount: 0,
      createdAt: NOW,
    });
  });

  it('001-AS2: rejects a capacity beyond the column range', () => {
    expect(() => openSlot(2_147_483_648)).toThrow(
      expect.objectContaining({ code: 'SLOT_CAPACITY_INVALID', kind: 'VALIDATION' }),
    );
    expect(openSlot(2_147_483_647).capacity).toBe(2_147_483_647);
  });

  it.each([0, -1, 1.5])('001-AS2: rejects a capacity below 1 or not whole (%j)', (capacity) => {
    expect(() => openSlot(capacity)).toThrow(
      expect.objectContaining({ code: 'SLOT_CAPACITY_INVALID', kind: 'VALIDATION' }),
    );
  });

  it.each([
    ['equal to', STARTS_AT],
    ['before', new Date('2026-11-01T08:00:00.000Z')],
  ])('001-AS2: rejects an end %s the start', (_label, endsAt) => {
    expect(() => openSlot(2, STARTS_AT, endsAt)).toThrow(
      expect.objectContaining({ code: 'SLOT_ENDS_BEFORE_START', kind: 'VALIDATION' }),
    );
  });

  it('001-AS4: registers a volunteer and counts one registration', () => {
    const slot = openSlot();
    const registration = slot.register(volunteer(1));

    expect(registration).toMatchObject({
      slotId: SLOT_ID,
      name: 'Bénévole 1',
      email: 'benevole1@example.com',
    });
    expect(slot.registeredCount).toBe(1);
  });

  it('001-AS5: refuses a registration on a full slot', () => {
    const slot = openSlot(2);
    slot.register(volunteer(1));
    slot.register(volunteer(2));

    expect(() => slot.register(volunteer(3))).toThrow(
      expect.objectContaining({ code: 'SLOT_FULL', kind: 'CONFLICT' }),
    );
    expect(slot.registeredCount).toBe(2);
  });
});
