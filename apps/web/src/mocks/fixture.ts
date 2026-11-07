import type { AnimationResponse, DisciplineResponse, LieuResponse } from '@joj/shared';

/**
 * Les données de la fausse API, en mémoire. Les handlers les lisent et les modifient comme la
 * vraie base ; `resetFixture()` (appelé après chaque test par `mockControl.reset()`) les remet
 * dans cet état, pour qu'un test ne dépende jamais de ce qu'un autre a créé ou supprimé.
 */
export const lutte: DisciplineResponse = {
  id: '0199f5c2-0000-7000-8000-000000000003',
  name: 'Lutte',
  category: 'sports-de-combat',
  createdAt: '2026-10-01T08:00:00.000Z',
};

export const natation: DisciplineResponse = {
  id: '0199f5c2-0000-7000-8000-000000000004',
  name: 'Natation',
  category: 'sports-nautiques',
  createdAt: '2026-10-01T08:00:00.000Z',
};

/** Un identifiant au bon format qu'aucune discipline ne porte. */
export const UNKNOWN_ID = '0199f5c2-0000-7000-8000-00000000ffff';

// ---------------------------------------------------------------------------
// Guide Touristique
// ---------------------------------------------------------------------------

export const lieuMusee: LieuResponse = {
  id: '0199f5c2-0000-7000-8000-000000000101',
  nom: 'Musée Théodore Monod',
  quartier: 'Plateau',
  type: 'musee',
};

export const lieuMarche: LieuResponse = {
  id: '0199f5c2-0000-7000-8000-000000000102',
  nom: 'Marché Sandaga',
  quartier: 'Médina',
  type: 'marche',
};

export const animationMatin: AnimationResponse = {
  id: '0199f5c2-0000-7000-8000-000000000201',
  nom: 'Concert de kora',
  date: '2026-11-01',
  heureDebut: '09:00',
  heureFin: '11:00',
  lieu: { ...lieuMusee },
};

export const animationApresMidi: AnimationResponse = {
  id: '0199f5c2-0000-7000-8000-000000000202',
  nom: 'Marché artisanal',
  date: '2026-11-01',
  heureDebut: '14:00',
  heureFin: '17:00',
  lieu: { ...lieuMarche },
};

const initial = (): {
  disciplines: DisciplineResponse[];
  animations: AnimationResponse[];
} => ({
  disciplines: [{ ...lutte }, { ...natation }],
  animations: [{ ...animationMatin }, { ...animationApresMidi }],
});

export const fixture = initial();

export function resetFixture(): void {
  Object.assign(fixture, initial());
  fixture.disciplines = [...initial().disciplines];
  fixture.animations = [...initial().animations];
}
