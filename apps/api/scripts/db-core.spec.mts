import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { seedFiles, seedStatements, tableNameFromFile } from './db-core.mts';

describe('seedFiles', () => {
  it('keeps only the JSON files, in loading order', () => {
    expect(seedFiles(['b.json', 'notes.txt', '01-a.json'])).toEqual(['01-a.json', 'b.json']);
  });

  it('002-AS1: loads the demo places before the animations that reference them', () => {
    const dataDir = fileURLToPath(new URL('../data', import.meta.url));
    const tables = seedFiles(readdirSync(dataDir)).map(tableNameFromFile);

    expect(tables).toContain('lieux');
    expect(tables).toContain('animations');
    expect(tables.indexOf('lieux')).toBeLessThan(tables.indexOf('animations'));
  });
});

describe('tableNameFromFile', () => {
  it('uses the file name without its ordering prefix', () => {
    expect(tableNameFromFile('disciplines.json')).toBe('disciplines');
    expect(tableNameFromFile('02-athletes.json')).toBe('athletes');
  });
});

describe('seedStatements', () => {
  it('builds one parameterized, idempotent INSERT per row', () => {
    expect(
      seedStatements('disciplines', [{ name: 'Lutte', category: 'sports-de-combat' }]),
    ).toEqual([
      {
        table: 'disciplines',
        sql: 'INSERT INTO "disciplines" ("name", "category") VALUES ($1, $2) ON CONFLICT DO NOTHING',
        params: ['Lutte', 'sports-de-combat'],
      },
    ]);
  });

  it('rejects a file that is not an array of objects', () => {
    expect(() => seedStatements('t', { name: 'x' })).toThrow(/tableau/);
    expect(() => seedStatements('t', ['x'])).toThrow(/ligne 0/);
  });
});
