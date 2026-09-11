import test from 'node:test';
import assert from 'node:assert/strict';
import { extractReview } from '../record-theme-review.mjs';

const input = { reviewInputSha256: 'a'.repeat(64), observedAt: '2026-09-12' };
test('typed output survives explanatory prose and gets the exact observation identity from CI', () => {
  const report = extractReview([{
    type: 'result', subtype: 'success', is_error: false,
    result: 'sha256を確認した。最終結果を返す。',
    structured_output: { status: 'blocked', reviewedAt: '2026-09-11' },
  }], input);
  assert.deepEqual(report, {
    status: 'blocked', schemaVersion: 1, inputSha256: input.reviewInputSha256,
    reviewedAt: '2026-09-12', month: '2026-09',
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
