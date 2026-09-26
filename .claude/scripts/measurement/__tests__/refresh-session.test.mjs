import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyLoginOutcome, parseKeychainAccount } from '../refresh-session.mjs';

test('ログイン後に管理画面へ着地しパスワード欄が無ければ ok', () => {
  assert.equal(classifyLoginOutcome('a8', { url: 'https://media-console.a8.net/home', hasPassword: false, hasChallenge: false }), 'ok');
  assert.equal(classifyLoginOutcome('moshimo', { url: 'https://af.moshimo.com/af/shop/index', hasPassword: false, hasChallenge: false }), 'ok');
});

test('再認証画面やログイン画面に留まれば login_failed (自動で再試行しない根拠)', () => {
  assert.equal(classifyLoginOutcome('a8', { url: 'https://media-console.a8.net/re-authentication', hasPassword: true, hasChallenge: false }), 'login_failed');
  assert.equal(classifyLoginOutcome('moshimo', { url: 'https://af.moshimo.com/af/shop/login', hasPassword: true, hasChallenge: false }), 'login_failed');
});

test('管理画面の URL でもパスワード欄が残っていれば ok にしない', () => {
  assert.equal(classifyLoginOutcome('a8', { url: 'https://media-console.a8.net/home', hasPassword: true, hasChallenge: false }), 'login_failed');
});

test('CAPTCHA / 2FA は突破せず human_required', () => {
  assert.equal(classifyLoginOutcome('a8', { url: 'https://www.a8.net/', hasPassword: true, hasChallenge: true }), 'human_required');
});

test('キーチェーン属性からアカウント名だけを取り出す', () => {
  const out = 'keychain: "/x.keychain-db"\nattributes:\n    "acct"<blob>="user123"\n    "svce"<blob>="stats47-measurement-a8"\n';
  assert.equal(parseKeychainAccount(out), 'user123');
  assert.equal(parseKeychainAccount('no attrs'), null);
});
