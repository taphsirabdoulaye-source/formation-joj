import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { Animation } from '../domain/animation';
import { Lieu } from '../domain/lieu';
import { DrizzleAnimationRepository } from './drizzle-animation.repository';

const plateau = Lieu.restore({
  id: '0199f5c2-0000-7000-8000-000000000001',
  nom: 'Musée Théodore Monod',
  quartier: 'Plateau',
  type: 'musee',
});

const medina = Lieu.restore({
  id: '0199f5c2-0000-7000-8000-000000000002',
  nom: 'Marché Sandaga',
  quartier: 'Médina',
  type: 'marche',
});

function makeAnimation(overrides: Partial<Parameters<typeof Animation.create>[0]> = {}): Animation {
  return Animation.create({
    id: randomUUID(),
    nom: 'Visite guidée',
    date: '2026-11-01',
    heureDebut: '09:00',
    heureFin: '11:00',
    lieu: plateau,
    ...overrides,
  });
}

describe('DrizzleAnimationRepository (in-memory PGlite, migrations applied)', () => {
  let connection: DatabaseConnection;
  let repository: DrizzleAnimationRepository;

  beforeAll(async () => {
    connection = openDatabase({ pgliteDataDir: 'memory://' });
    await connection.migrate();
    repository = new DrizzleAnimationRepository(connection.db);

    // Insérer les lieux de référence directement en base (seed minimal pour les tests)
    const { sql } = await import('drizzle-orm');
    await connection.db.execute(
      sql`INSERT INTO lieux (id, nom, quartier, type) VALUES
        ('0199f5c2-0000-7000-8000-000000000001', 'Musée Théodore Monod', 'Plateau', 'musee'),
        ('0199f5c2-0000-7000-8000-000000000002', 'Marché Sandaga', 'Médina', 'marche')
        ON CONFLICT DO NOTHING`,
    );
  });

  afterAll(() => connection?.close());

  it('002-AS1: reads back what it wrote, with the joined lieu', async () => {
    const animation = makeAnimation({ nom: 'Visite Plateau', date: '2026-11-01' });
    await repository.insert(animation);

    const result = await repository.listByDate('2026-11-01');
    const found = result.find((a) => a.id === animation.id);

    expect(found).toBeDefined();
    expect(found?.nom).toBe('Visite Plateau');
    expect(found?.lieu.id).toBe(plateau.id);
    expect(found?.lieu.nom).toBe(plateau.nom);
  });

  it('002-AS1: lists animations of a day sorted by heureDebut', async () => {
    const date = '2026-11-02';
    await repository.insert(
      makeAnimation({ nom: 'Soir', date, heureDebut: '18:00', heureFin: '20:00' }),
    );
    await repository.insert(
      makeAnimation({ nom: 'Matin', date, heureDebut: '08:00', heureFin: '10:00' }),
    );
    await repository.insert(
      makeAnimation({ nom: 'Midi', date, heureDebut: '12:00', heureFin: '14:00' }),
    );

    const result = await repository.listByDate(date);
    expect(result.map((a) => a.nom)).toEqual(['Matin', 'Midi', 'Soir']);
  });

  it('002-AS2: returns empty for a day with no animations', async () => {
    expect(await repository.listByDate('2026-11-10')).toEqual([]);
  });

  it('002-AS1: only returns animations of the requested date', async () => {
    const a1 = makeAnimation({ nom: 'Jour 3', date: '2026-11-03' });
    const a2 = makeAnimation({ nom: 'Jour 4', date: '2026-11-04' });
    await repository.insert(a1);
    await repository.insert(a2);

    const result = await repository.listByDate('2026-11-03');
    expect(result.map((a) => a.nom)).toContain('Jour 3');
    expect(result.map((a) => a.nom)).not.toContain('Jour 4');
  });

  it('finds a lieu by its id', async () => {
    expect(await repository.findLieuById(plateau.id)).toMatchObject({
      id: plateau.id,
      nom: plateau.nom,
    });
    expect(await repository.findLieuById(medina.id)).toMatchObject({
      id: medina.id,
      nom: medina.nom,
    });
    expect(await repository.findLieuById(randomUUID())).toBeNull();
  });

  it('preserves heureDebut and heureFin as HH:MM (PostgreSQL time may return HH:MM:SS)', async () => {
    const animation = makeAnimation({
      nom: 'Format Heure',
      date: '2026-11-05',
      heureDebut: '14:30',
      heureFin: '16:45',
    });
    await repository.insert(animation);

    const [found] = await repository.listByDate('2026-11-05');
    expect(found?.heureDebut).toBe('14:30');
    expect(found?.heureFin).toBe('16:45');
  });
});
