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

// KDP (2026-09-27 追加)。意図: 2FA・追加確認・CAPTCHA の画面を「ログイン失敗」と取り違えず、人の確認として止める。
test('KDP: bookshelf without a password field is ok; Amazon MFA / CVF / CAPTCHA pages are human_required', () => {
  const none = { hasPassword: false, hasChallenge: false };
  assert.equal(classifyLoginOutcome('kdp', { url: 'https://kdp.amazon.co.jp/ja_JP/bookshelf', ...none }), 'ok');
  assert.equal(classifyLoginOutcome('kdp', { url: 'https://www.amazon.co.jp/ap/mfa?arb=x', ...none }), 'human_required');
  assert.equal(classifyLoginOutcome('kdp', { url: 'https://www.amazon.co.jp/ap/cvf/request', ...none }), 'human_required');
  assert.equal(classifyLoginOutcome('kdp', { url: 'https://www.amazon.co.jp/errors/validateCaptcha', ...none }), 'human_required');
  // パスワード欄が残ったままのサインイン画面は ID/PW 不一致として 1 回で止める
  assert.equal(classifyLoginOutcome('kdp', { url: 'https://www.amazon.co.jp/ap/signin', hasPassword: true, hasChallenge: false }), 'login_failed');
  // KDP の URL でもサインイン画面の途中なら ok にしない
  assert.equal(classifyLoginOutcome('kdp', { url: 'https://kdp.amazon.co.jp/ap/signin', ...none }), 'login_failed');
});
