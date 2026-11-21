import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { zipSync } from 'fflate';
import { archivedFixture, table, workbookBytes } from './fixtures.mjs';
import { localKey } from '../lib/archive.mjs';
import { normalizeRecipe } from '../normalize-source.mjs';
import { csvMembers } from '../lib/normalize.mjs';

async function fixture(t) {
  const f = await archivedFixture(t, { files: {
    'selected.csv': Buffer.from('pref,city,kind,value\n1,101,病院,2\n'),
    'unused.xlsx': Buffer.from('invalid workbook; must not be expanded'),
  }, definition: { ...table, filePattern: '^selected\\.csv$' } });
  for (const [key, { body }] of f.objects) {
    const target = localKey(f.root, key);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body);
  }
  return f;
}

test('normalization skips unmatched raw workbooks after verifying all sources', async (t) => {
  const f = await fixture(t);
  const result = await normalizeRecipe(f.recipe, f.root);
  assert.equal(result.status, 'normalized');
  assert.equal(result.outputs[0].rows, 2);
});

test('SHA verification rejects tampering of even an unmatched source before output', async (t) => {
  const f = await fixture(t);
  const unused = f.entry.files.find((file) => file.url.endsWith('unused.xlsx'));
  const target = localKey(f.root, unused.key);
  const bytes = fs.readFileSync(target);
  bytes[0] ^= 1; // Preserve size so this specifically exercises SHA validation.
  fs.writeFileSync(target, bytes);
  await assert.rejects(normalizeRecipe(f.recipe, f.root), /SHA|sha|hash/i);
  assert.equal(fs.existsSync(path.join(f.root, '.local/r2/open-data/normalized')), false);
});

test('selected expansion budget is cumulative across CSV and archive inputs', async () => {
  const budget = { used: 0 };
  await csvMembers(Buffer.alloc(6), 'one.csv', 10, ['\\.csv$'], budget);
  const zip = Buffer.from(zipSync({ 'two.csv': Buffer.alloc(5), 'unused.xlsx': Buffer.alloc(10000) }));
  await assert.rejects(csvMembers(zip, 'archive.zip', 10, ['\\.csv$'], budget), /limit/);
  const members = await csvMembers(zip, 'archive.zip', 5, ['\\.csv$']);
  assert.deepEqual(members.map((m) => m.name), ['two.csv']);
});

test('selected XLSX internal expansion is charged across multiple workbooks', async () => {
  const bytes = await workbookBytes();
  const first = { used: 0 };
  await csvMembers(bytes, 'one.xlsx', undefined, ['\\.xlsx$'], first);
  assert.ok(first.used > bytes.length);
  const budget = { used: 0 };
  await csvMembers(bytes, 'one.xlsx', first.used, ['\\.xlsx$'], budget);
  await assert.rejects(csvMembers(bytes, 'two.xlsx', first.used, ['\\.xlsx$'], budget), /limit/);
});
