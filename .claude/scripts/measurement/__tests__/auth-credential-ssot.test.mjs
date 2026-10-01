import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LOGIN } from '../refresh-session.mjs';
import { ciCredentialServices, credentialServices, parseCmdkeyList, readCiCredential, readCredential, storedAccounts } from '../credential-store.mjs';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const WORKFLOW = readFileSync(`${ROOT}.github/workflows/authenticated-measurement.yml`, 'utf8');
const services = credentialServices();

// 意図: 正本に「自動ログインする」と書いた service と、実際にセレクタを持つ service を一致させる。
// 片方だけ増やすと、管理画面の表示と実際の挙動が食い違う。
test('autoLogin=true の service と refresh-session の LOGIN が一致する', () => {
  const auto = Object.entries(services).filter(([, v]) => v.autoLogin).map(([k]) => k).sort();
  assert.deepEqual(auto, Object.keys(LOGIN).sort());
});

test('項目名は stats47-measurement-<service> で、ID やパスワードを持たない', () => {
  for (const [id, v] of Object.entries(services)) {
    assert.equal(v.storeItem, `stats47-measurement-${id}`, id);
    assert.deepEqual(Object.keys(v).filter((k) => /user|password|secret|email/i.test(k)), [], id);
  }
});

// 意図: CI がパスワードを持つ service は正本の ciCredential=true だけ。workflow の matrix.auth と 1:1 で、
// 自動ログインできない service に Secrets を渡さない。
test('workflow が Secrets を渡す source は ciCredential=true の service と一致する', () => {
  const wired = [...WORKFLOW.matchAll(/\{source: (\w+), secret: \w+, auth: (\w+)\}/g)].map(([, s, a]) => {
    assert.equal(a, s.toUpperCase(), s);
    return s;
  }).sort();
  assert.deepEqual(wired, ciCredentialServices().sort());
  for (const s of wired) assert.ok(services[s].autoLogin, `${s} は autoLogin=false なのに CI 資格情報を持つ`);
});

test('CI の資格情報は GitHub Actions で、許可 service が指定されたときだけ読む', () => {
  const env = { GITHUB_ACTIONS: 'true', STATS47_AUTH_SOURCE: 'note', STATS47_AUTH_USER: 'u', STATS47_AUTH_PASSWORD: 'p' };
  assert.deepEqual(readCiCredential('note', env), { user: 'u', password: 'p', totpSecret: null });
  assert.deepEqual(readCredential('note', { platform: 'linux', env }), { user: 'u', password: 'p', totpSecret: null });
  assert.equal(readCiCredential('afb', { ...env, STATS47_AUTH_SOURCE: 'afb' }), null, 'ciCredential=false (保管のみ)');
  assert.equal(readCiCredential('coconala', env), null, '別 service の Secrets を使わない');
  assert.equal(readCiCredential('note', { ...env, GITHUB_ACTIONS: undefined }), null, 'GitHub Actions 以外');
  assert.equal(readCiCredential('note', { ...env, STATS47_AUTH_PASSWORD: '' }), null, 'Secrets 未登録');
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
