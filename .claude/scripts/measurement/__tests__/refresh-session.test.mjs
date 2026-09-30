import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyLoginOutcome, LOGIN, passTotpIfOffered } from '../refresh-session.mjs';
import { parseKeychainAccount, totpCode } from '../credential-store.mjs';

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

// TOTP (2026-09-28)。意図: 認証アプリ方式の 2FA 画面でだけコードを入れ、秘密鍵が無い・画面が違うときは何もしない
// (呼び側が human_required で止める)。CAPTCHA や追加確認 (/ap/cvf) をコード入力で通そうとしない。
function fakePage(url, { otpVisible = true } = {}) {
  const calls = [];
  const locator = (selector) => ({
    first: () => ({
      isVisible: async () => selector === LOGIN.kdp.otp.input && otpVisible,
      fill: async (value) => calls.push(['fill', selector, value]),
      check: async () => calls.push(['check', selector]),
    }),
  });
  return {
    calls,
    url: () => url,
    locator,
    click: async (selector) => calls.push(['click', selector]),
    waitForLoadState: async () => {},
    waitForTimeout: async () => {},
  };
}

test('KDP の認証アプリ 2FA 画面では TOTP を計算して 1 回だけ入力する', async () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const page = fakePage('https://www.amazon.co.jp/ap/mfa?arb=x');
  const before = totpCode(secret);
  assert.equal(await passTotpIfOffered(page, LOGIN.kdp, { user: 'u', password: 'p', totpSecret: secret }), true);
  const fill = page.calls.find(([kind]) => kind === 'fill');
  assert.equal(fill[1], LOGIN.kdp.otp.input);
  // 30 秒の境界をまたいだ場合も、前後どちらかのコードと一致する
  assert.ok([before, totpCode(secret)].includes(fill[2]));
  assert.deepEqual(page.calls.filter(([kind]) => kind === 'click').map(([, s]) => s), [LOGIN.kdp.otp.submit]);
});

test('TOTP 秘密鍵が無い・2FA 以外の画面・入力欄が見えないときは何もしない', async () => {
  const cred = { user: 'u', password: 'p', totpSecret: 'JBSWY3DPEHPK3PXP' };
  for (const [page, c] of [
    [fakePage('https://www.amazon.co.jp/ap/mfa'), { ...cred, totpSecret: null }],
    [fakePage('https://www.amazon.co.jp/ap/cvf/request'), cred],
    [fakePage('https://www.amazon.co.jp/errors/validateCaptcha'), cred],
    [fakePage('https://www.amazon.co.jp/ap/mfa', { otpVisible: false }), cred],
  ]) {
    assert.equal(await passTotpIfOffered(page, LOGIN.kdp, c), false);
    assert.equal(page.calls.length, 0);
  }
  // A8・もしもは 2FA の設定を持たないので入力しない
  assert.equal(await passTotpIfOffered(fakePage('https://www.a8.net/ap/mfa'), LOGIN.a8, cred), false);
});
