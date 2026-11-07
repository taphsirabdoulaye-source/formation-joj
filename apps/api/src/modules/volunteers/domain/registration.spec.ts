import { describe, expect, it } from 'vitest';
import { Registration } from './registration';

const NOW = new Date('2026-10-31T09:00:00.000Z');
const ID = '0199f5c2-0000-7000-8000-000000000201';
const SLOT_ID = '0199f5c2-0000-7000-8000-000000000101';

const register = (name: string, email: string) =>
  Registration.create({ id: ID, slotId: SLOT_ID, name, email, now: NOW });

describe('Registration', () => {
  it('001-AS4: creates a registration with a trimmed name and the email', () => {
    expect(register('  Awa Diop  ', 'awa.diop@example.com')).toMatchObject({
      id: ID,
      slotId: SLOT_ID,
      name: 'Awa Diop',
      email: 'awa.diop@example.com',
      createdAt: NOW,
    });
  });

  it.each(['', '   '])('001-AS6: rejects an empty name (%j)', (name) => {
    expect(() => register(name, 'awa.diop@example.com')).toThrow(
      expect.objectContaining({ code: 'REGISTRATION_NAME_REQUIRED', kind: 'VALIDATION' }),
    );
  });

  it('001-AS6: rejects an email longer than 254 characters', () => {
    const longest = `${'a'.repeat(242)}@example.com`;
    expect(register('Awa Diop', longest).email).toHaveLength(254);
    expect(() => register('Awa Diop', `a${longest}`)).toThrow(
      expect.objectContaining({ code: 'REGISTRATION_EMAIL_INVALID', kind: 'VALIDATION' }),
    );
  });

  it.each(['', 'awa.diop', 'awa@', '@example.com', 'awa diop@example.com'])(
    '001-AS6: rejects a malformed email (%j)',
    (email) => {
      expect(() => register('Awa Diop', email)).toThrow(
        expect.objectContaining({ code: 'REGISTRATION_EMAIL_INVALID', kind: 'VALIDATION' }),
      );
    },
  );
});
