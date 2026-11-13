import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LOGIN } from '../refresh-session.mjs';
import { credentialServices, parseCmdkeyList, readCredential, storedAccounts } from '../credential-store.mjs';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const services = credentialServices();

// 意図: 正本に「自動ログインする」と書いた service と、実際にセレクタを持つ service を一致させる。
// 片方だけ増やすと、管理画面の表示と実際の挙動が食い違う。
test('autoLogin=true の service と refresh-session の LOGIN が一致する', () => {
  const auto = Object.entries(services).filter(([, v]) => v.autoLogin).map(([k]) => k).sort();
  assert.deepEqual(auto, Object.keys(LOGIN).sort());
});

test('項目名は stats47-measurement-<service> で、パスワードを持たない (ログイン ID は loginId だけ)', () => {
  for (const [id, v] of Object.entries(services)) {
    assert.equal(v.storeItem, `stats47-measurement-${id}`, id);
    assert.deepEqual(Object.keys(v).filter((k) => /user|password|secret|email/i.test(k)), [], id);
  }
});

// 意図 (2026-10-20 オーナー判断): ログインは Mac だけが持つ。CI (Linux) に ID/PW の環境変数が渡されても読まない。
// 正本にも「CI が使う」「Secrets に保管する」の印を残さない (残すと管理画面が Secrets の登録を促す)。
test('Mac・Windows 以外では、ID/PW の環境変数が渡されていても資格情報を読まない', () => {
  const env = { GITHUB_ACTIONS: 'true', STATS47_AUTH_SOURCE: 'note', STATS47_AUTH_USER: 'u', STATS47_AUTH_PASSWORD: 'p' };
  const exec = () => { throw new Error('資格情報ストアを呼ばない'); };
  assert.equal(readCredential('note', { platform: 'linux', env, exec }), null);
  for (const [id, v] of Object.entries(services)) {
    assert.deepEqual(Object.keys(v).filter((k) => /^ci/i.test(k)), [], id);
  }
});

test('cmdkey /list の英語・日本語出力から項目名と ID を取り出す', () => {
  const ja = 'ターゲット: LegacyGeneric:target=stats47-measurement-a8\n種類: 汎用\nユーザー: a8user\n\nターゲット: LegacyGeneric:target=stats47-measurement-x\n種類: 汎用\n';
  const en = 'Target: LegacyGeneric:target=stats47-measurement-note\nType: Generic\nUser: me@example.com\n';
  assert.deepEqual([...parseCmdkeyList(ja)], [['stats47-measurement-a8', 'a8user'], ['stats47-measurement-x', null]]);
  assert.deepEqual([...parseCmdkeyList(en)], [['stats47-measurement-note', 'me@example.com']]);
});

// 意図: 管理画面は登録の有無と ID だけを見る。パスワードを取り出すコマンド (-w / CredRead) を呼ばない。
test('storedAccounts はパスワードを読まない', () => {
  const calls = [];
  const exec = (cmd, args) => {
    calls.push([cmd, ...args].join(' '));
    if (cmd === 'security' && args.includes('stats47-measurement-a8')) return '"acct"<blob>="a8user"\n';
    if (cmd === 'security') throw new Error('not found');
    return 'Target: LegacyGeneric:target=stats47-measurement-a8\nUser: a8user\n';
  };
  const items = ['stats47-measurement-a8', 'stats47-measurement-kdp'];
  const expected = { 'stats47-measurement-a8': { stored: true, user: 'a8user' }, 'stats47-measurement-kdp': { stored: false, user: null } };
  assert.deepEqual(storedAccounts(items, { platform: 'darwin', exec }), expected);
  assert.deepEqual(storedAccounts(items, { platform: 'win32', exec }), expected);
  assert.equal(storedAccounts(items, { platform: 'linux', exec }), null);
  assert.ok(calls.every((c) => !/ -w\b|CredRead/.test(c)), calls.join('\n'));
});
