import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  decodeBase32, parseKeychainAccount, parseWindowsCredOutput, readCredential, readSecret, serviceName, totpCode,
} from '../credential-store.mjs';

// RFC 6238 Appendix B (SHA-1、秘密鍵 "12345678901234567890"、8 桁)。認証アプリと同じ計算であることを固定する。
test('TOTP は RFC 6238 の試験値と一致する', () => {
  const key = Buffer.from('12345678901234567890', 'ascii');
  for (const [seconds, code] of [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'], [1234567890, '89005924'], [2000000000, '69279037']]) {
    assert.equal(totpCode(key, { time: seconds * 1000, digits: 8 }), code);
  }
});

test('base32 の秘密鍵は空白・小文字・パディングを許して同じ鍵になる', () => {
  const key = Buffer.from('12345678901234567890', 'ascii');
  assert.deepEqual(decodeBase32('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'), key);
  assert.deepEqual(decodeBase32('gezd gnbv gy3t qojq gezd gnbv gy3t qojq=='), key);
  assert.equal(totpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', { time: 59000, digits: 8 }), '94287082');
  assert.throws(() => decodeBase32('not-base32!'), /invalid_base32/);
});

test('サービス名は Mac と Windows で共通', () => {
  assert.equal(serviceName('a8'), 'stats47-measurement-a8');
  assert.equal(serviceName('kdp', 'totp'), 'stats47-measurement-kdp-totp');
});

test('キーチェーン属性からアカウント名だけを取り出す', () => {
  assert.equal(parseKeychainAccount('attributes:\n    "acct"<blob>="user123"\n'), 'user123');
  assert.equal(parseKeychainAccount('no attrs'), null);
});

test('Windows の出力は base64 JSON で、壊れていれば null (登録なしと同じ扱い)', () => {
  const encode = (value) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64');
  assert.deepEqual(parseWindowsCredOutput(encode({ user: 'ユーザー', password: 'p@ss' })), { user: 'ユーザー', password: 'p@ss' });
  assert.equal(parseWindowsCredOutput(encode({ user: 'u', password: '' })), null);
  assert.equal(parseWindowsCredOutput('%%%'), null);
});

// 意図: OS ごとの読み口を 1 か所で切り替え、CI (linux) では資格情報を読まない。
test('OS ごとに読み口を切り替え、CI (linux) では何も呼ばない', () => {
  const seen = [];
  const fakeExec = (command, args, options) => {
    seen.push({ command, target: options?.env?.STATS47_CRED_TARGET ?? args[args.indexOf('-s') + 1], wantsPassword: args.includes('-w') });
    if (command === 'security') return args.includes('-w') ? 'pw-mac\n' : '"acct"<blob>="id-mac"';
    return Buffer.from(JSON.stringify({ user: 'id-win', password: 'pw-win' })).toString('base64');
  };
  assert.deepEqual(readSecret('stats47-measurement-a8', { platform: 'darwin', exec: fakeExec }), { user: 'id-mac', password: 'pw-mac' });
  assert.deepEqual(readSecret('stats47-measurement-a8', { platform: 'win32', exec: fakeExec }), { user: 'id-win', password: 'pw-win' });
  assert.equal(seen.find((s) => s.command === 'powershell.exe').target, 'stats47-measurement-a8');
  const before = seen.length;
  assert.equal(readSecret('stats47-measurement-a8', { platform: 'linux', exec: fakeExec }), null);
  assert.equal(seen.length, before);
});

test('ログイン情報が無ければ null。TOTP が無ければ totpSecret は null', () => {
  const exec = (command, args, options) => {
    const target = options.env.STATS47_CRED_TARGET;
    if (target === 'stats47-measurement-a8') return Buffer.from(JSON.stringify({ user: 'u', password: 'p' })).toString('base64');
    throw new Error('not found');
  };
  assert.deepEqual(readCredential('a8', { platform: 'win32', exec }), { user: 'u', password: 'p', totpSecret: null });
  assert.equal(readCredential('moshimo', { platform: 'win32', exec }), null);
});

// 実機の資格情報マネージャーで往復を確かめる (Windows だけ)。本物の資格情報には触れず、試験用の名前を作って消す。
test('Windows: cmdkey で登録した資格情報を読み、削除後は null になる', { skip: process.platform !== 'win32' }, () => {
  const target = `stats47-measurement-selftest-${process.pid}`;
  execFileSync('cmdkey', [`/generic:${target}`, '/user:selftest-user', '/pass:selftest-パス'], { stdio: 'ignore' });
  try {
    assert.deepEqual(readSecret(target, { platform: 'win32' }), { user: 'selftest-user', password: 'selftest-パス' });
  } finally {
    execFileSync('cmdkey', [`/delete:${target}`], { stdio: 'ignore' });
  }
  assert.equal(readSecret(target, { platform: 'win32' }), null);
});
