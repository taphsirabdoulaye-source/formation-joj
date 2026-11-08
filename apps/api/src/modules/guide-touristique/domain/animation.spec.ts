import { describe, expect, it } from 'vitest';
import { Animation } from './animation';
import { GuideTouristiqueError } from './guide-touristique.errors';
import { Lieu } from './lieu';

const ID = '0199f5c2-0000-7000-8000-000000000010';

const dakar = Lieu.restore({
  id: '0199f5c2-0000-7000-8000-000000000001',
  nom: 'Musée Théodore Monod',
  quartier: 'Plateau',
  type: 'musee',
});

const BASE: Parameters<typeof Animation.create>[0] = {
  id: ID,
  nom: 'Visite guidée',
  date: '2026-11-01',
  heureDebut: '09:00',
  heureFin: '11:00',
  lieu: dakar,
};

describe('Animation', () => {
  it('creates an animation with a trimmed name', () => {
    const animation = Animation.create({ ...BASE, nom: '  Visite guidée  ' });
    expect(animation).toMatchObject({
      id: ID,
      nom: 'Visite guidée',
      date: '2026-11-01',
      heureDebut: '09:00',
      heureFin: '11:00',
    });
    expect(animation.lieu.id).toBe(dakar.id);
  });

  it.each(['', '   '])('rejects an animation without a name (%j)', (nom) => {
    expect(() => Animation.create({ ...BASE, nom })).toThrow(
      expect.objectContaining({ code: 'ANIMATION_NOM_REQUIRED', kind: 'VALIDATION' }),
    );
  });

  it('rejects a name that is too long', () => {
    expect(() => Animation.create({ ...BASE, nom: 'x'.repeat(151) })).toThrow(
      expect.objectContaining({ code: 'ANIMATION_NOM_TOO_LONG' }),
    );
  });

  it('rejects a date outside the JOJ period (before)', () => {
    expect(() => Animation.create({ ...BASE, date: '2026-10-30' })).toThrow(
      expect.objectContaining({ code: 'ANIMATION_OUTSIDE_GAMES_PERIOD', kind: 'BUSINESS_RULE' }),
    );
  });

  it('rejects a date outside the JOJ period (after)', () => {
    expect(() => Animation.create({ ...BASE, date: '2026-11-14' })).toThrow(
      expect.objectContaining({ code: 'ANIMATION_OUTSIDE_GAMES_PERIOD', kind: 'BUSINESS_RULE' }),
    );
  });

  it('accepts the first and last days of the JOJ period', () => {
    expect(() => Animation.create({ ...BASE, date: '2026-10-31' })).not.toThrow();
    expect(() => Animation.create({ ...BASE, date: '2026-11-13' })).not.toThrow();
  });

  it('rejects a fin time equal to or before debut time', () => {
    expect(() => Animation.create({ ...BASE, heureDebut: '10:00', heureFin: '10:00' })).toThrow(
      expect.objectContaining({ code: 'ANIMATION_FIN_BEFORE_DEBUT', kind: 'VALIDATION' }),
    );
    expect(() => Animation.create({ ...BASE, heureDebut: '10:00', heureFin: '09:00' })).toThrow(
      expect.objectContaining({ code: 'ANIMATION_FIN_BEFORE_DEBUT' }),
    );
  });

  describe('isEnCours', () => {
    const animation = Animation.create(BASE); // 09:00–11:00

    it('002-AS4: true when heure is within [heureDebut, heureFin[', () => {
      expect(animation.isEnCours('09:00')).toBe(true); // borne incluse
      expect(animation.isEnCours('10:30')).toBe(true);
      expect(animation.isEnCours('10:59')).toBe(true);
    });

    it('002-AS4: false when heure is exactly heureFin (excluded)', () => {
      expect(animation.isEnCours('11:00')).toBe(false); // borne exclue
    });

    it('002-AS3: false when heure is before heureDebut', () => {
      expect(animation.isEnCours('08:59')).toBe(false);
    });

    it('002-AS3: false when heure is after heureFin', () => {
      expect(animation.isEnCours('11:01')).toBe(false);
    });
  });

  it('restore does not re-validate rules', () => {
    // restore() recharge sans rejouer les règles : pas d'exception.
    expect(() => Animation.restore({ ...BASE, nom: 'x'.repeat(200), lieu: dakar })).not.toThrow();
  });

  it('rejects an error class that is a GuideTouristiqueError', () => {
    expect(() => Animation.create({ ...BASE, nom: '' })).toThrow(GuideTouristiqueError);
  });
});
