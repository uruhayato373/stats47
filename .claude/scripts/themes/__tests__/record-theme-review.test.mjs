import test from 'node:test';
import assert from 'node:assert/strict';
import { extractReview } from '../record-theme-review.mjs';

test('successful model JSON is available to the trusted state writer', () => {
  assert.deepEqual(
    extractReview([
      {
        type: 'result',
        subtype: 'success',
        is_error: false,
        result: '{"schemaVersion":1,"status":"no-change"}',
      },
    ]),
    { schemaVersion: 1, status: 'no-change' }
  );
});
test('a success flag without a report does not manufacture a completed review', () => {
  for (const entry of [
    { type: 'result', subtype: 'success', is_error: false },
    { type: 'result', subtype: 'success', result: 'I could not finish' },
    { type: 'result', subtype: 'error_max_turns', result: '{}' },
    { type: 'result', subtype: 'success', is_error: true, result: '{}' },
    { type: 'result', subtype: 'success', result: '[]' },
  ])
    assert.throws(() => extractReview([entry]));
});
