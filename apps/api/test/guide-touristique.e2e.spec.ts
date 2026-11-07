import type { INestApplication } from '@nestjs/common';
import { animationListSchema } from '@joj/shared';
import { sql } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DATABASE } from '../src/core/database/database.module';
import { createTestApp } from './create-test-app';

describe('/api/guide-touristique (e2e)', () => {
  let app: INestApplication;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    const db = app.get<{ execute: (q: unknown) => Promise<unknown> }>(DATABASE);
    await db.execute(sql`
      INSERT INTO lieux (id, nom, quartier, type) VALUES
        ('0199f5c2-0000-7000-8000-000000000101', 'Musée Théodore Monod', 'Plateau', 'musee'),
        ('0199f5c2-0000-7000-8000-000000000102', 'Marché Sandaga', 'Médina', 'marche')
      ON CONFLICT DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO animations (id, nom, date, heure_debut, heure_fin, lieu_id) VALUES
        ('0199f5c2-0000-7000-8000-000000000201', 'Concert de kora',  '2026-11-01', '09:00', '11:00', '0199f5c2-0000-7000-8000-000000000101'),
        ('0199f5c2-0000-7000-8000-000000000202', 'Marché artisanal',  '2026-11-01', '14:00', '17:00', '0199f5c2-0000-7000-8000-000000000102'),
        ('0199f5c2-0000-7000-8000-000000000203', 'Visite guidée',     '2026-11-01', '10:00', '12:00', '0199f5c2-0000-7000-8000-000000000101'),
        ('0199f5c2-0000-7000-8000-000000000204', 'Atelier danse',     '2026-11-02', '15:00', '17:00', '0199f5c2-0000-7000-8000-000000000102')
      ON CONFLICT DO NOTHING
    `);
  });

  afterAll(() => app?.close());

  it('AS1: lists animations of a day sorted by heureDebut (200)', async () => {
    const response = await api().get('/api/guide-touristique/agenda/2026-11-01').expect(200);
    const animations = animationListSchema.parse(response.body);

    expect(animations).toHaveLength(3);
    const heures = animations.map((a) => a.heureDebut);
    expect(heures).toEqual(['09:00', '10:00', '14:00']);
  });

  it('AS1: returns an empty list for a day with no animations (200)', async () => {
    const response = await api().get('/api/guide-touristique/agenda/2026-11-05').expect(200);
    expect(animationListSchema.parse(response.body)).toEqual([]);
  });

  it('AS1: each animation includes its lieu', async () => {
    const response = await api().get('/api/guide-touristique/agenda/2026-11-01').expect(200);
    const animations = animationListSchema.parse(response.body);
    for (const animation of animations) {
      expect(animation.lieu).toMatchObject({ id: expect.any(String), nom: expect.any(String) });
    }
  });

  it('AS2: returns animations currently in progress at a given time (200)', async () => {
    // À 10:30 : Concert (09:00–11:00) et Visite guidée (10:00–12:00) sont en cours
    const response = await api()
      .get('/api/guide-touristique/en-cours?at=2026-11-01T10:30:00Z')
      .expect(200);
    const animations = animationListSchema.parse(response.body);

    expect(animations).toHaveLength(2);
    const noms = animations.map((a) => a.nom).sort();
    expect(noms).toEqual(['Concert de kora', 'Visite guidée']);
  });

  it('AS2: returns empty list when nothing is in progress (200)', async () => {
    const response = await api()
      .get('/api/guide-touristique/en-cours?at=2026-11-01T13:00:00Z')
      .expect(200);
    expect(animationListSchema.parse(response.body)).toEqual([]);
  });

  it('AS2: heureFin is excluded from the interval', async () => {
    // À 11:00 exactement : Concert (09:00–11:00) n'est plus en cours
    const response = await api()
      .get('/api/guide-touristique/en-cours?at=2026-11-01T11:00:00Z')
      .expect(200);
    const noms = animationListSchema.parse(response.body).map((a) => a.nom);
    expect(noms).not.toContain('Concert de kora');
  });

  it('AS2: heureDebut is included in the interval', async () => {
    // À 09:00 exactement : Concert (09:00–11:00) est en cours
    const response = await api()
      .get('/api/guide-touristique/en-cours?at=2026-11-01T09:00:00Z')
      .expect(200);
    const noms = animationListSchema.parse(response.body).map((a) => a.nom);
    expect(noms).toContain('Concert de kora');
  });

  it('AS3: rejects an invalid date format for the agenda route (400)', async () => {
    const response = await api().get('/api/guide-touristique/agenda/01-11-2026').expect(400);
    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
  });

  it('AS3: rejects a missing ?at parameter for the en-cours route (400)', async () => {
    const response = await api().get('/api/guide-touristique/en-cours').expect(400);
    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
  });
});
