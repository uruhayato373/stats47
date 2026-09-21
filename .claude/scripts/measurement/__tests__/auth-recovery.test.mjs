import assert from 'node:assert/strict';
import test from 'node:test';
import { authenticationPause, rejectedAuthentication } from '../auth-recovery.mjs';

const seed = { capturedAt: '2026-09-21T06:00:00Z', bootstrapCapturedAt: '2026-09-21T05:00:00Z' };
const previous = { source: 'kdp', status: 'failed', code: 'auth_required', observedAt: '2026-09-21T07:00:00Z' };
test('already rejected legacy login is paused without probing, not confused with a newer human login', () => {
  const pause = authenticationPause('kdp', seed, null, previous);
  assert.equal(pause.blockedSince, previous.observedAt);
  assert.equal(authenticationPause('kdp', { ...seed, capturedAt: '2026-09-21T07:02:00Z' }, null, previous).blockedSince,
    previous.observedAt, 'an account-only refresh after a report auth failure is not a new human login');
  assert.equal(authenticationPause('kdp', { capturedAt: '2026-09-21T08:00:00Z' }, null, previous), null);
  for (const code of ['timeout', 'report_incomplete', 'storage_error']) {
    assert.equal(authenticationPause('kdp', seed, null, { ...previous, code }), null);
  }
  assert.equal(authenticationPause('kdp', seed, null, { ...previous, source: 'note' }), null);
});
test('CI refresh and time passing never clear a blocked human-login generation', () => {
  const recovery = rejectedAuthentication('kdp', seed, previous.observedAt);
  assert.deepEqual(authenticationPause('kdp', { ...seed, capturedAt: '2026-10-21T00:00:00Z' }, recovery), recovery);
  assert.deepEqual(authenticationPause('kdp', { capturedAt: '2026-09-20T00:00:00Z' }, recovery), recovery);
  assert.equal(authenticationPause('kdp', { capturedAt: '2026-09-21T08:00:00Z' }, recovery), null);
  assert.throws(() => authenticationPause('kdp', seed, { ...recovery, source: 'note' }), /vault_recovery/);
  assert.throws(() => authenticationPause('kdp', seed, { ...recovery, bootstrapCapturedAt: null }), /vault_recovery/);
  assert.throws(() => authenticationPause('kdp', {}, recovery), /session_missing/);
});
