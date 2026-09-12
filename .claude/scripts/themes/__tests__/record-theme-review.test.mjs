import test from 'node:test';
import assert from 'node:assert/strict';
import { extractReview, validateReplay } from '../record-theme-review.mjs';

const input = { reviewInputSha256: 'a'.repeat(64), observedAt: '2026-09-12' };
test('typed output survives explanatory prose and gets the exact observation identity from CI', () => {
  const report = extractReview([{
    type: 'result', subtype: 'success', is_error: false,
    result: 'sha256を確認した。最終結果を返す。',
    structured_output: { status: 'blocked', reviewedAt: '2026-09-11', sourceReviews: [] },
  }], input, ['aging-society']);
  assert.deepEqual(report, {
    status: 'blocked', schemaVersion: 1, inputSha256: input.reviewInputSha256,
    reviewedAt: '2026-09-12', month: '2026-09', sourceReviews: [], unreviewedThemes: ['aging-society'],
  });
});
test('success prose, missing typed output and failed execution do not manufacture a report', () => {
  for (const entry of [
    { type: 'result', subtype: 'success', result: '{"status":"no-change"}' },
    { type: 'result', subtype: 'success' },
    { type: 'result', subtype: 'error_max_turns', structured_output: {} },
    { type: 'result', subtype: 'success', is_error: true, structured_output: {} },
    { type: 'result', subtype: 'success', structured_output: [] },
  ]) assert.throws(() => extractReview([entry], input));
});

test('monthly source coverage accumulates evidence and resets with the month', () => {
  const previous = { month: '2026-09', sourceReviews: [{themeKey: 'a'}] };
  const entries = [{ type: 'result', subtype: 'success', structured_output: {sourceReviews: [{themeKey: 'b'}], unreviewedThemes: []} }];
  assert.deepEqual(extractReview(entries, input, ['a','b','c'], previous).unreviewedThemes, ['c']);
  assert.deepEqual(extractReview(entries, {...input, observedAt:'2026-10-01'}, ['a','b','c'], previous).unreviewedThemes, ['a','c']);
});

test('saved reports cannot be replayed against a different observation or run', () => {
  const current = {...input, runUrl:'https://github.com/owner/repo/actions/runs/123'};
  const report = {inputSha256:input.reviewInputSha256, reviewedAt:input.observedAt};
  assert.doesNotThrow(() => validateReplay(report, current, '123'));
  assert.throws(() => validateReplay(report, current, '124'));
  assert.throws(() => validateReplay({...report, inputSha256:'stale'}, current, '123'));
  assert.throws(() => validateReplay({...report, reviewedAt:'2026-09-11'}, current, '123'));
});
