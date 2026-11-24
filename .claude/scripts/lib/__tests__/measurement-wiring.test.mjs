// measurement の部品 (packages/ops/src/measurement) と、.claude に残る CLI の本文の配線を確かめる基盤のテスト。
// 部品のテストは packages に移したが、CLI の本文は .claude にあるので、ここで突き合わせる (SCRIPTS-TO-PACKAGES-02)。
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, symlinkSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { assertClosedNativeProfile } from '../../../../packages/ops/src/measurement/native-profile.mjs';

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
    const bootstrap = readFileSync(new URL('../../measurement/bootstrap-session.mjs', import.meta.url), 'utf8');
    assert.ok(bootstrap.indexOf('assertClosedNativeProfile(profile)') < bootstrap.indexOf('cpSync(profile, temporaryProfile'),
      'check before copying an incomplete native profile');
  } finally { rmSync(profile, { recursive: true, force: true }); }
});

test('collect-local は bootstrap と collect の失敗に stderr の末尾を残す', () => {
  const runner = readFileSync(new URL('../../measurement/collect-local.mjs', import.meta.url), 'utf8');
  assert.match(runner, /step: 'bootstrap'.*message: tailLines\(boot\.stderr\)/);
  assert.match(runner, /step: 'collect'.*message: tailLines\(collected\.stderr\)/);
  assert.doesNotMatch(runner, /message: lastLine\(boot\.stderr\)/);
});

test('単独の取得の終了コードは自前の条件でなく共有の関数で決める', () => {
  const dir = new URL('../../note/', import.meta.url);
  const script = readFileSync(new URL('fetch-note-metrics.mjs', dir), 'utf8');
  assert.match(script, /process\.exitCode = noteMetricsExitCode\(snapshot, joined\)/);
  assert.doesNotMatch(script, /snapshot\.status === "pass" && joined\.status === "pass" \? 0 : 2/);
});
