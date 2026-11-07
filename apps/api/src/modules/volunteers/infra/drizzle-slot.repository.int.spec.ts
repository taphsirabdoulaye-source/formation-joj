import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { Discipline } from '../../disciplines/domain/discipline';
import { DrizzleDisciplineRepository } from '../../disciplines/infra/drizzle-discipline.repository';
import { Slot } from '../domain/slot';
import { DrizzleSlotRepository } from './drizzle-slot.repository';

const NOW = new Date('2026-10-31T09:00:00.123Z');

describe('DrizzleSlotRepository (in-memory PGlite, migrations applied)', () => {
  let connection: DatabaseConnection;
  let repository: DrizzleSlotRepository;
  let disciplineId: string;

  const openSlot = async (capacity: number) => {
    const slot = Slot.create({
      id: randomUUID(),
      disciplineId,
      startsAt: new Date('2026-11-01T09:00:00.000Z'),
      endsAt: new Date('2026-11-01T12:00:00.000Z'),
      capacity,
      now: NOW,
    });
    await repository.insert(slot);
    return slot;
  };

  const volunteer = (n: number) => ({
    id: randomUUID(),
    name: `Bénévole ${n}`,
    email: `benevole${n}@example.com`,
    now: NOW,
  });

  beforeAll(async () => {
    connection = openDatabase({ pgliteDataDir: 'memory://' });
    await connection.migrate();
    repository = new DrizzleSlotRepository(connection.db);
    const lutte = Discipline.create({
      id: randomUUID(),
      name: 'Lutte',
      category: 'sports-de-combat',
      now: NOW,
    });
    await new DrizzleDisciplineRepository(connection.db).insert(lutte);
    disciplineId = lutte.id;
  });

  afterAll(() => connection?.close());

  it('001-AS1: reads back exactly the slot it wrote, with no registration', async () => {
    const slot = await openSlot(2);

    expect(await repository.findById(slot.id)).toEqual(slot);
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('001-AS3: knows whether a discipline exists', async () => {
    expect(await repository.disciplineExists(disciplineId)).toBe(true);
    expect(await repository.disciplineExists(randomUUID())).toBe(false);
  });

  it('001-AS4: reads back a slot with its registration count', async () => {
    const slot = await openSlot(2);
    await repository.addRegistration(slot.register(volunteer(1)));

    expect((await repository.findById(slot.id))?.registeredCount).toBe(1);
  });

  it('001-AS5: lets only two of three concurrent registrations into a slot of capacity 2', async () => {
    const slot = await openSlot(2);
    // Trois lectures du créneau vide, comme trois requêtes arrivées en même temps.
    const copies = await Promise.all([1, 2, 3].map(() => repository.findById(slot.id)));
    const results = await Promise.allSettled(
      copies.map((copy, i) => repository.addRegistration(copy!.register(volunteer(i + 1)))),
    );

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(2);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: expect.objectContaining({ code: 'SLOT_FULL' }),
    });
    expect((await repository.findById(slot.id))?.registeredCount).toBe(2);
  });

  it('001-AS6: refuses a registration on a slot that does not exist', async () => {
    const ghost = Slot.restore({
      id: randomUUID(),
      disciplineId,
      startsAt: new Date('2026-11-01T09:00:00.000Z'),
      endsAt: new Date('2026-11-01T12:00:00.000Z'),
      capacity: 2,
      registeredCount: 0,
      createdAt: NOW,
    });

    await expect(repository.addRegistration(ghost.register(volunteer(1)))).rejects.toMatchObject({
      code: 'SLOT_NOT_FOUND',
    });
  });
});
