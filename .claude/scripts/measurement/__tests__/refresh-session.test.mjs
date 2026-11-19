import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyLoginOutcome, LOGIN, passTotpIfOffered, refresh } from '../refresh-session.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseKeychainAccount, totpCode } from '../../../../packages/ops/src/measurement/credential-store.mjs';

test('failed automatic login stays paused; explicit human recovery saves only a verified session', async () => {
  const root = mkdtempSync(join(tmpdir(), 'stats47-human-recovery-'));
  const dir = join(root, '.local/authenticated-measurement');
  mkdirSync(dir, { recursive: true });
  const marker = join(dir, 'note.autologin-failed');
  writeFileSync(marker, 'previous automated failure');
  let opens = 0, checks = 0, validState = true;
  const page = {
    goto: async () => {}, url: () => LOGIN.note.checkUrl, waitForTimeout: async () => {},
    evaluate: async () => ({ hasPassword: checks++ === 0, hasChallenge: checks < 2, hasReady: true }),
  };
  const chromiumImpl = { launchPersistentContext: async () => {
    opens++;
    return { pages: () => [page], addCookies: async () => {}, storageState: async () => ({ cookies: validState ? [{ name: 'fixture', value: 'test', domain: '.note.com', path: '/' }] : [], origins: [] }), close: async () => {} };
  } };
  const opts = { root, headed: true, chromiumImpl };
  try {
    assert.equal((await refresh('note', { ...opts, waitHuman: false })).status, 'blocked');
    assert.equal(opens, 0);
    assert.ok(existsSync(marker));
    const recovered = await refresh('note', { ...opts, waitHuman: true });
    assert.equal(recovered.status, 'ok');
    assert.equal(recovered.loggedInBy, 'human');
    assert.equal(checks, 2);
    assert.ok(!existsSync(marker));
    assert.ok(existsSync(join(root, '.local/playwright-note-state.json')));
    writeFileSync(marker, 'another failure');
    validState = false;
    await assert.rejects(refresh('note', { ...opts, waitHuman: true }), /session_missing/);
    assert.ok(existsSync(marker));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

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

test('X: ホームに着けば ok、ログイン画面や追加確認に残れば止める (突破しない)', () => {
  assert.equal(classifyLoginOutcome('x', { url: 'https://x.com/home', hasPassword: false, hasChallenge: false }), 'ok');
  assert.equal(classifyLoginOutcome('x', { url: 'https://x.com/i/flow/login', hasPassword: false, hasChallenge: true }), 'human_required');
  assert.equal(classifyLoginOutcome('x', { url: 'https://x.com/account/access', hasPassword: false, hasChallenge: false }), 'human_required');
  assert.equal(LOGIN.x.bundledChromium, true, 'publish-x と同じ Chromium で開く (Chrome 本体で開くとプロファイルが壊れうる)');
  assert.equal(LOGIN.x.localOnly, true, 'X の state は CI へ渡さない');
});

// ---- note: 描画待ちと「判定できない」(2026-11-16。10-22 に読み込み中の画面で login_failed と判定され、失敗印で 3 週止まった) ----

test('note: 画面の状態を読めない (描画中・遷移中) ときは失敗にせず undetermined', () => {
  const url = LOGIN.note.checkUrl;
  assert.equal(classifyLoginOutcome('note', { url, hasPassword: null, hasChallenge: false }), 'undetermined');
  // 売上管理の URL でも、中身がまだ描かれていなければ通ったとは言えない
  assert.equal(classifyLoginOutcome('note', { url, hasPassword: false, hasChallenge: false, hasReady: false }), 'undetermined');
  assert.equal(classifyLoginOutcome('note', { url, hasPassword: false, hasChallenge: false, hasReady: true }), 'ok');
  // パスワード欄が残っていれば、通らなかったと確認できたので login_failed
  assert.equal(classifyLoginOutcome('note', { url, hasPassword: true, hasChallenge: false, hasReady: true }), 'login_failed');
});

/** キーチェーンの値で再確認を送る流れの偽ブラウザ。signals は pageSignals が返す順、api は売上 API の応答の error.code */
function noteFlow(root, { signals, api = null }) {
  const queue = [...signals];
  const last = signals.at(-1);
  const page = {
    calls: [],
    goto: async () => {}, url: () => LOGIN.note.checkUrl, waitForTimeout: async () => {},
    waitForLoadState: async () => {}, waitForSelector: async () => {}, screenshot: async () => Buffer.from(''),
    locator: (sel) => ({ first: () => ({ isVisible: async () => sel === LOGIN.note.password, check: async () => {} }) }),
    fill: async (sel) => page.calls.push(['fill', sel]), click: async (sel) => page.calls.push(['click', sel]),
    evaluate: async (fn) => {
      const src = String(fn);
      if (src.includes('stats/sales')) return api ? 'verification_required' : 'ok';
      if (src.includes('role=alert')) return [];
      return queue.length ? queue.shift() : last;
    },
  };
  const chromiumImpl = { launchPersistentContext: async () => ({
    pages: () => [page], addCookies: async () => {}, close: async () => {},
    storageState: async () => ({ cookies: [{ name: 'fixture', value: 'test', domain: '.note.com', path: '/' }], origins: [] }),
  }) };
  return { page, opts: { root, chromiumImpl, readCredentialImpl: () => ({ user: 'u', password: 'p' }) } };
}

const NEEDS_CONFIRM = { hasPassword: true, hasChallenge: false, hasReady: true };
const LOADING = { hasPassword: false, hasChallenge: false, hasReady: false };
const CONFIRMED = { hasPassword: false, hasChallenge: false, hasReady: true };

test('note: 再確認の送信後に描画が終わらなければ印を書かず、2 回続いたら印を書いて止める', async () => {
  const root = mkdtempSync(join(tmpdir(), 'stats47-note-undetermined-'));
  const marker = join(root, '.local/authenticated-measurement/note.autologin-failed');
  try {
    const first = noteFlow(root, { signals: [NEEDS_CONFIRM, LOADING] });
    assert.equal((await refresh('note', first.opts)).status, 'undetermined');
    assert.equal(first.page.calls.filter(([k]) => k === 'click').length, 1, 'パスワードの送信は 1 回の実行で 1 回');
    assert.ok(!existsSync(marker), '1 回目は印を書かない (次の実行で試し直す)');
    const second = noteFlow(root, { signals: [NEEDS_CONFIRM, LOADING] });
    assert.equal((await refresh('note', second.opts)).status, 'undetermined');
    assert.ok(existsSync(marker), '2 回続いたら印を書いて自動の試行を止める');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('note: 描画を待って売上管理が出れば ok、連続の数え直しも消える', async () => {
  const root = mkdtempSync(join(tmpdir(), 'stats47-note-ready-'));
  const count = join(root, '.local/authenticated-measurement/note.undetermined-count');
  try {
    await refresh('note', noteFlow(root, { signals: [NEEDS_CONFIRM, LOADING] }).opts);
    assert.ok(existsSync(count));
    // 送信後しばらく描画中 (LOADING) でも、待つうちに売上管理が出れば ok
    const result = await refresh('note', noteFlow(root, { signals: [NEEDS_CONFIRM, LOADING, LOADING, CONFIRMED] }).opts);
    assert.equal(result.status, 'ok');
    assert.equal(result.loggedInBy, 'credential-store');
    assert.ok(!existsSync(count));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('note: 画面は通って見えても売上 API が再確認を求めれば login_failed で印を書く', async () => {
  const root = mkdtempSync(join(tmpdir(), 'stats47-note-api-'));
  try {
    const result = await refresh('note', noteFlow(root, { signals: [NEEDS_CONFIRM, CONFIRMED], api: 'user_verification_needed' }).opts);
    assert.equal(result.status, 'login_failed');
    assert.ok(existsSync(join(root, '.local/authenticated-measurement/note.autologin-failed')));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('画面の状態を読めなかった (evaluate が失敗した) ときに、ログイン済みとして保存しない', () => {
  // 以前は pageSignals の失敗を hasPassword: true に倒していた。null は「読めない」で、ok にも login_failed にもしない
  assert.equal(classifyLoginOutcome('a8', { url: 'https://media-console.a8.net/home', hasPassword: null, hasChallenge: false }), 'undetermined');
});
