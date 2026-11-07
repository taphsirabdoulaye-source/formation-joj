import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Animation } from '../domain/animation';
import { Lieu } from '../domain/lieu';
import { InMemoryAnimationRepository } from './testing/in-memory-animation.repository';
import { GetAnimationsEnCours } from './use-cases/get-animations-en-cours';
import { ListAnimationsDuJour } from './use-cases/list-animations-du-jour';

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

function setup() {
  const repo = new InMemoryAnimationRepository();
  repo.seedLieux([plateau, medina]);
  return {
    repo,
    listAnimationsDuJour: new ListAnimationsDuJour(repo),
    getAnimationsEnCours: new GetAnimationsEnCours(repo),
  };
}

describe('guide-touristique (application layer)', () => {
  it('AS1: lists the animations of a day sorted by heureDebut', async () => {
    const { repo, listAnimationsDuJour } = setup();

    const visite = makeAnimation({ heureDebut: '14:00', heureFin: '16:00' });
    const concert = makeAnimation({ nom: 'Concert', heureDebut: '09:00', heureFin: '11:00' });
    const conf = makeAnimation({ nom: 'Conférence', heureDebut: '11:30', heureFin: '13:00' });

    await repo.insert(visite);
    await repo.insert(concert);
    await repo.insert(conf);

    const result = await listAnimationsDuJour.execute('2026-11-01');
    expect(result.map((a) => a.nom)).toEqual(['Concert', 'Conférence', 'Visite guidée']);
  });

  it('AS1: returns an empty list when there are no animations that day', async () => {
    const { listAnimationsDuJour } = setup();
    expect(await listAnimationsDuJour.execute('2026-11-02')).toEqual([]);
  });

  it('AS1: only returns animations of the requested date', async () => {
    const { repo, listAnimationsDuJour } = setup();
    await repo.insert(makeAnimation({ date: '2026-11-01' }));
    await repo.insert(makeAnimation({ nom: 'Autre jour', date: '2026-11-02' }));

    const result = await listAnimationsDuJour.execute('2026-11-01');
    expect(result).toHaveLength(1);
    expect(result[0]?.nom).toBe('Visite guidée');
  });

  it('AS2: returns animations currently in progress at a given time', async () => {
    const { repo, getAnimationsEnCours } = setup();

    // 09:00–11:00
    await repo.insert(makeAnimation({ nom: 'Matin', heureDebut: '09:00', heureFin: '11:00' }));
    // 10:00–12:00
    await repo.insert(makeAnimation({ nom: 'Midi', heureDebut: '10:00', heureFin: '12:00' }));
    // 14:00–16:00 — pas en cours à 10:30
    await repo.insert(makeAnimation({ nom: 'Après-midi', heureDebut: '14:00', heureFin: '16:00' }));

    const enCours = await getAnimationsEnCours.execute('2026-11-01T10:30:00Z');
    expect(enCours.map((a) => a.nom).sort()).toEqual(['Matin', 'Midi']);
  });

  it('AS2: returns empty when nothing is in progress', async () => {
    const { repo, getAnimationsEnCours } = setup();
    await repo.insert(makeAnimation({ heureDebut: '14:00', heureFin: '16:00' }));

    expect(await getAnimationsEnCours.execute('2026-11-01T10:00:00Z')).toEqual([]);
  });

  it('AS2: heureFin is excluded from the interval', async () => {
    const { repo, getAnimationsEnCours } = setup();
    await repo.insert(makeAnimation({ heureDebut: '09:00', heureFin: '11:00' }));

    // Exactement à 11:00 : plus en cours
    expect(await getAnimationsEnCours.execute('2026-11-01T11:00:00Z')).toEqual([]);
    // À 10:59 : encore en cours
    expect(await getAnimationsEnCours.execute('2026-11-01T10:59:00Z')).toHaveLength(1);
  });

  it('AS2: heureDebut is included in the interval', async () => {
    const { repo, getAnimationsEnCours } = setup();
    await repo.insert(makeAnimation({ heureDebut: '09:00', heureFin: '11:00' }));

    // Exactement à 09:00 : en cours
    expect(await getAnimationsEnCours.execute('2026-11-01T09:00:00Z')).toHaveLength(1);
  });
});
