import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diffDocsErrors } from '../lib/docs-error-delta.mjs';

const err = (code, file, message) => ({ level: 'error', code, file, message });
const ksj = err('DG084', 'data/ci/monthly-jobs/ksj-catalog.json', '2026-10 分の記録が無い');

test('適用前からある error は止めない (別 workflow の state が原因の DG084 で triage を捨てない)', () => {
  const r = diffDocsErrors({ errors: [ksj] }, { errors: [ksj] });
  assert.deepEqual(r.added, []);
  assert.deepEqual(r.preexisting, [ksj]);
});

test('提案の適用で増えた error は止める', () => {
  const bad = err('DG054', '.claude/todo/improvements.md', 'Due の形式が不正');
  const r = diffDocsErrors({ errors: [ksj] }, { errors: [ksj, bad] });
  assert.deepEqual(r.added, [bad]);
});

test('同じ code と file でも message が変われば新規として止める (件数の悪化を見逃さない)', () => {
  const worse = { ...ksj, message: '2026-10 と 2026-11 分の記録が無い' };
  assert.deepEqual(diffDocsErrors({ errors: [ksj] }, { errors: [worse] }).added, [worse]);
});

test('適用前のレポートが無ければ全 error を新規として止める (fail-closed)', () => {
  assert.deepEqual(diffDocsErrors(null, { errors: [ksj] }).added, [ksj]);
});
