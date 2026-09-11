/** Synthetic contract tests; no downloaded XLSX/PDF or .local state required. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateConfig,
  validateSourceBytes,
  sha,
  FIELDS,
  EXPECTED_SOURCES,
} from './ingest-parks-childcare.mjs';
const fixture = (field) => ({
  key: field.key,
  unit: field.unit,
  years: { from: field.year, to: field.year },
  yearFormat: 'calendar',
  entities: ['prefecture'],
  isActive: true,
  display: { conversionFactor: 1, decimalPlaces: 0 },
  source: structuredClone(EXPECTED_SOURCES[field.key]),
});
for (const field of FIELDS)
  test('accept original unit/cohort ' + field.key, () =>
    validateConfig(fixture(field), field)
  );
for (const [name, mutate] of [
  [
    'wrong population',
    (c) => (c.source.config.provenance.population = 'new-applications-only'),
  ],
  ['wrong as-of date', (c) => (c.source.config.provenance.asOf = '2024-04-01')],
  [
    'wrong source bytes pin',
    (c) => (c.source.config.provenance.sourceSha256 = '0'.repeat(64)),
  ],
  ['wrong count unit', (c) => (c.unit = '千人')],
  ['wrong year', (c) => (c.years.from = 2024)],
  ['fiscal instead of calendar year', (c) => (c.yearFormat = 'fiscal')],
  ['silent unit rescaling', (c) => (c.display.conversionFactor = 1000)],
  [
    'normalization against unrelated resident population',
    (c) =>
      (c.calculation = { normalizationOptions: [{ type: 'per_population' }] }),
  ],
  ['different geography', (c) => (c.entities = ['city'])],
  [
    'derived instead of reported count',
    (c) => (c.calculation = { isCalculated: true }),
  ],
])
  test('reject ' + name, () => {
    const c = fixture(FIELDS[1]);
    mutate(c);
    assert.throws(() => validateConfig(c, FIELDS[1]));
  });
const bytes = Buffer.from('synthetic-official-source-pin'),
  source = { filename: 'fixture', sha256: sha(bytes), bytes: bytes.length };
test('accept verified source bytes', () => validateSourceBytes(source, bytes));
test('reject same-length source corruption', () => {
  const changed = Buffer.from(bytes);
  changed[0] ^= 1;
  assert.throws(() => validateSourceBytes(source, changed));
});
test('reject source truncation', () =>
  assert.throws(() => validateSourceBytes(source, bytes.subarray(0, -1))));
