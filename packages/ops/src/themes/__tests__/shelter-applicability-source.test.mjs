import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseApplicabilityMarker,
  parseCommonId,
} from '../ingest-shelter-applicability.mjs';
test('official 1 and blank retain applicable and nonapplicable meaning', () => {
  assert.equal(parseApplicabilityMarker('1'), true);
  assert.equal(parseApplicabilityMarker(''), false);
});
for (const marker of ['0', '2', '不明', '-', ' 1', null, undefined, 0, 1])
  test(`unapproved marker ${String(marker)} is not guessed`, () =>
    assert.throws(() => parseApplicabilityMarker(marker)));
test('common ID preserves the source municipality and both separate facility classes', () => {
  assert.deepEqual(parseCommonId('E0110000001202', 'emergency'), {
    municipalityCode: '01100',
    type: '20',
  });
  assert.deepEqual(parseCommonId('E0110000001111', 'shelter'), {
    municipalityCode: '01100',
    type: '11',
  });
  assert.deepEqual(parseCommonId('E011000000112A', 'shelter'), {
    municipalityCode: '01100',
    type: '12',
  });
});
for (const [id, kind] of [
  ['E0110000001202', 'shelter'],
  ['E0110000001111', 'emergency'],
  ['E0110000001211', 'emergency'],
  ['E0110000001101', 'shelter'],
  ['0110000001202', 'emergency'],
  ['E0110000001200', 'emergency'],
  ['E0110000001202', 'unknown'],
])
  test(`invalid ID/class ${id}/${kind} rejects`, () =>
    assert.throws(() => parseCommonId(id, kind)));
