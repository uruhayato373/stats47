import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, symlinkSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { assertClosedNativeProfile } from '../native-profile.mjs';

test('native session export refuses a live or dangling Chrome lock without modifying the profile', () => {
  const profile = mkdtempSync(join(tmpdir(), 'stats47-native-profile-'));
  try {
    assert.doesNotThrow(() => assertClosedNativeProfile(profile));
    const lock = join(profile, 'SingletonLock');
    symlinkSync('host-999999999', lock);
    assert.throws(() => assertClosedNativeProfile(profile), /native_profile_open/);
    rmSync(lock);
    writeFileSync(lock, 'locked');
    assert.throws(() => assertClosedNativeProfile(profile), /native_profile_open/);
    assert.equal(readFileSync(lock, 'utf8'), 'locked');
    rmSync(lock);
    assert.doesNotThrow(() => assertClosedNativeProfile(profile));
    const bootstrap = readFileSync(new URL('../bootstrap-session.mjs', import.meta.url), 'utf8');
    assert.ok(bootstrap.indexOf('assertClosedNativeProfile(profile)') < bootstrap.indexOf('cpSync(profile, temporaryProfile'),
      'check before copying an incomplete native profile');
  } finally { rmSync(profile, { recursive: true, force: true }); }
});
