import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  agentView, chromeTimeToMs, classifySession, cookiesFromChromeRows, cookiesFromState, notificationText, preflightAlerts,
  readProfileCookies, runPreflight, sessionDefinitions, writePreflight, PREFLIGHT_FILE,
} from '../session-preflight.mjs';
import { LOGIN } from '../refresh-session.mjs';
import { credentialServices } from '../credential-store.mjs';

const NOW = Date.parse('2026-11-14T00:00:00Z');
const DAY = 86400000;
const def = { label: 'X', refreshSource: 'x', domains: ['x.com'], authCookies: ['auth_token'] };
const cookie = (expiresAt, name = 'auth_token') => ({ name, domain: '.x.com', expiresAt });
const classify = (input) => classifySession({ def, now: NOW, ...input });

// 意図: 「切れる前に」知らせるのが目的なので、期限まで warnDays 以内を有効と分ける。境界は warnDays ちょうどを含む。
test('認証 cookie の期限で 有効 / 期限が近い / 切れている に分ける', () => {
  assert.equal(classify({ cookies: [cookie(NOW + 30 * DAY)] }).state, 'valid');
  assert.equal(classify({ cookies: [cookie(NOW + 3 * DAY)] }).state, 'expiring');
  assert.equal(classify({ cookies: [cookie(NOW + 3 * DAY + 1)] }).state, 'valid');
  assert.equal(classify({ cookies: [cookie(NOW + 3 * DAY)], warnDays: 2 }).state, 'valid');
  assert.equal(classify({ cookies: [cookie(NOW - 1)] }).state, 'expired');
  assert.equal(classify({ cookies: [cookie(NOW + 30 * DAY)] }).expiresAt, new Date(NOW + 30 * DAY).toISOString());
});

// 意図: 認証 cookie 以外 (広告・計測の cookie) の期限で「有効」と言わない。認証 cookie が消えていれば切れている。
test('認証 cookie が無ければ、ほかの cookie が期限内でも切れている', () => {
  const r = classify({ cookies: [cookie(NOW + 300 * DAY, '_ga'), cookie(NOW + 300 * DAY, 'guest_id')] });
  assert.equal(r.state, 'expired');
  assert.equal(r.expiresAt, null);
});

// 意図: 失敗印がある間は refresh-session が自動で入り直さないので、cookie が期限内でも人が要る状態として先に出す。
test('失敗印は cookie の期限より優先する', () => {
  const r = classify({ cookies: [cookie(NOW + 300 * DAY)], failMark: { at: '2026-11-08T00:00:00.000Z' } });
  assert.equal(r.state, 'autologin_failed');
  assert.equal(r.failedAt, '2026-11-08T00:00:00.000Z');
  assert.equal(r.recovery, 'node .claude/scripts/measurement/refresh-session.mjs x --wait-human');
});

// 意図: 期限を読めないものを「有効」や「切れている」に推測で寄せない。理由を必ず持たせる。
test('期限を cookie から読めないものは 確認できない とし、理由を持つ', () => {
  const sessionOnly = classify({ cookies: [cookie(null)] });
  assert.equal(sessionOnly.state, 'unknown');
  assert.match(sessionOnly.reason, /セッション cookie/);
  const missing = classify({ cookies: null });
  assert.equal(missing.state, 'unknown');
  assert.match(missing.reason, /プロファイル/);
  const unreadable = classifySession({ def: { label: 'afb', unreadable: 'headless を拒否する' }, cookies: [cookie(NOW + DAY)], now: NOW });
  assert.deepEqual([unreadable.state, unreadable.reason], ['unknown', 'headless を拒否する']);
  const unnamed = classifySession({ def: { label: 'y', domains: ['y.com'], authCookies: [] }, cookies: [], now: NOW });
  assert.equal(unnamed.state, 'unknown');
});

test('認証 cookie が複数あれば最も早い期限で判定する (早めに知らせる側へ倒す)', () => {
  const r = classifySession({ def: { ...def, authCookies: ['SID', '__Secure-1PSID'] }, now: NOW,
    cookies: [cookie(NOW + 100 * DAY, 'SID'), cookie(NOW + 2 * DAY, '__Secure-1PSID'), cookie(null, 'SID')] });
  assert.equal(r.state, 'expiring');
  assert.equal(r.expiresAt, new Date(NOW + 2 * DAY).toISOString());
});

// 意図: cookie の値を持ち出さない。読み口の出力は名前・domain・期限だけ。
test('storageState から写すのは対象 domain の名前と期限だけで、値を持たない', () => {
  const state = { cookies: [
    { name: 'auth_token', value: 'SECRET-FIXTURE', domain: '.x.com', expires: 1800000000 },
    { name: 'lang', value: 'ja', domain: 'x.com', expires: -1 },
    { name: 'other', value: 'SECRET-FIXTURE', domain: '.example.com', expires: 1800000000 },
  ], origins: [] };
  const out = cookiesFromState(state, ['x.com']);
  assert.deepEqual(out, [
    { name: 'auth_token', domain: '.x.com', expiresAt: 1800000000000 },
    { name: 'lang', domain: 'x.com', expiresAt: null },
  ]);
  assert.doesNotMatch(JSON.stringify(out), /SECRET-FIXTURE/);
  assert.equal(cookiesFromState({}, ['x.com']), null);
});

test('Chromium の expires_utc (1601 起点のマイクロ秒) を Unix ミリ秒にする', () => {
  const unix = Date.parse('2027-06-01T11:01:32.000Z');
  assert.equal(chromeTimeToMs((unix + 11644473600000) * 1000), unix);
  assert.equal(chromeTimeToMs(0), null);
  assert.deepEqual(cookiesFromChromeRows([
    { host_key: '.x.com', name: 'auth_token', expires_utc: (unix + 11644473600000) * 1000, has_expires: 1 },
    { host_key: '.x.com', name: 'lang', expires_utc: 0, has_expires: 0 },
    { host_key: 'evil-x.com', name: 'auth_token', expires_utc: 1, has_expires: 1 },
  ], ['x.com']), [
    { name: 'auth_token', domain: '.x.com', expiresAt: unix },
    { name: 'lang', domain: '.x.com', expiresAt: null },
  ]);
});

// 意図: プロファイルの SQLite から値の列 (value / encrypted_value) を SELECT しない。読み取り専用・ロックなしで開く。
test('プロファイルの Cookies は名前・期限の列だけを読み取り専用で読む', () => {
  const profile = mkdtempSync(join(tmpdir(), 'stats47-preflight-profile-'));
  try {
    mkdirSync(join(profile, 'Default/Network'), { recursive: true });
    writeFileSync(join(profile, 'Default/Network/Cookies'), '');
    const calls = [];
    const exec = (cmd, args) => { calls.push([cmd, ...args]); return JSON.stringify([{ host_key: '.x.com', name: 'auth_token', expires_utc: 0, has_expires: 0 }]); };
    const out = readProfileCookies(profile, ['x.com'], { exec });
    assert.deepEqual(out, [{ name: 'auth_token', domain: '.x.com', expiresAt: null }]);
    const [cmd, ...args] = calls[0];
    assert.equal(cmd, 'sqlite3');
    assert.ok(args.includes('-readonly'));
    assert.match(args.find((a) => a.startsWith('file:')), /immutable=1$/);
    assert.doesNotMatch(args.at(-1), /value/i);
    assert.equal(readProfileCookies(join(profile, 'none'), ['x.com'], { exec }), null);
  } finally { rmSync(profile, { recursive: true, force: true }); }
});

const hasSqlite = spawnSync('sqlite3', ['-version']).status === 0;
test('実際の SQLite (fixture) から名前と期限を読む', { skip: !hasSqlite && 'sqlite3 が無い' }, () => {
  const profile = mkdtempSync(join(tmpdir(), 'stats47-preflight-sqlite-'));
  try {
    mkdirSync(join(profile, 'Default'), { recursive: true });
    const expires = (NOW + 10 * DAY + 11644473600000) * 1000;
    execFileSync('sqlite3', [join(profile, 'Default/Cookies'),
      `CREATE TABLE cookies (host_key TEXT, name TEXT, value TEXT, encrypted_value BLOB, expires_utc INTEGER, has_expires INTEGER);
       INSERT INTO cookies VALUES ('.threads.com', 'sessionid', 'SECRET-FIXTURE', x'00', ${expires}, 1);
       INSERT INTO cookies VALUES ('.example.com', 'sessionid', 'SECRET-FIXTURE', x'00', ${expires}, 1);`]);
    const out = readProfileCookies(profile, ['threads.com']);
    assert.deepEqual(out, [{ name: 'sessionid', domain: '.threads.com', expiresAt: NOW + 10 * DAY }]);
    assert.doesNotMatch(JSON.stringify(out), /SECRET-FIXTURE/);
  } finally { rmSync(profile, { recursive: true, force: true }); }
});

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'stats47-preflight-root-'));
  mkdirSync(join(root, '.local/authenticated-measurement'), { recursive: true });
  mkdirSync(join(root, 'data/authenticated'), { recursive: true });
  return root;
}
const config = { sessions: {
  _comment: 'fixture',
  a8: { label: 'A8.net', refreshSource: 'a8', state: 'playwright-a8-state.json', domains: ['a8.net'], authCookies: ['token'], lastSuccess: { measurement: 'a8' } },
  note: { label: 'note', refreshSource: 'note', state: 'playwright-note-state.json', domains: ['note.com'], authCookies: ['token'], lastSuccess: { measurement: 'note' } },
  x: { label: 'X', refreshSource: 'x', state: 'playwright-x-state.json', domains: ['x.com'], authCookies: ['token'], lastSuccess: { log: 'x-posted.jsonl' } },
  'kdp-reports': { label: 'KDP レポート', refreshSource: 'kdp', failMark: 'kdp', unreadable: '別認証' },
  gsc: { label: 'Google', profile: 'playwright-google-admin-profile', domains: ['google.com'], authCookies: ['SID'], recoveryNote: '人がログインする' },
} };

test('runPreflight はファイルだけを読み、取得元ごとの状態・最終成功・復旧を返す', () => {
  const root = fixtureRoot();
  try {
    const state = (domain, expiresMs) => JSON.stringify({ cookies: [{ name: 'token', value: 'SECRET-FIXTURE', domain, expires: expiresMs / 1000 }], origins: [] });
    writeFileSync(join(root, '.local/playwright-a8-state.json'), state('.a8.net', NOW + DAY));
    writeFileSync(join(root, '.local/playwright-note-state.json'), state('.note.com', NOW + 90 * DAY));
    writeFileSync(join(root, '.local/playwright-x-state.json'), state('.x.com', NOW - DAY));
    writeFileSync(join(root, '.local/authenticated-measurement/note.autologin-failed'), '2026-11-08T00:00:00.000Z login_failed\n');
    writeFileSync(join(root, '.local/authenticated-measurement/kdp.autologin-failed'), '2026-11-09T00:00:00.000Z human_required\n');
    writeFileSync(join(root, '.local/x-posted.jsonl'), '{"id":1,"at":"2026-11-10T00:00:00.000Z"}\n{"id":2,"at":"2026-11-12T00:00:00.000Z"}\n');
    writeFileSync(join(root, 'data/authenticated/latest.json'), JSON.stringify({ sources: [
      { source: 'a8', status: 'pass', observedAt: '2026-11-08T00:09:53.386Z' }, { source: 'note', status: 'failed', observedAt: '2026-11-08T00:10:00.000Z' }] }));
    const result = runPreflight({ root, now: NOW, config, exec: () => { throw new Error('sqlite3 は呼ばれない'); } });
    const by = Object.fromEntries(result.sources.map((s) => [s.source, s]));
    assert.deepEqual(Object.fromEntries(result.sources.map((s) => [s.source, s.state])),
      { a8: 'expiring', note: 'autologin_failed', x: 'expired', 'kdp-reports': 'autologin_failed', gsc: 'unknown' });
    assert.equal(by.a8.lastSuccessAt, '2026-11-08T00:09:53.386Z');
    assert.equal(by.note.lastSuccessAt, null, '失敗した取得を最終成功にしない');
    assert.equal(by.x.lastSuccessAt, '2026-11-12T00:00:00.000Z');
    assert.equal(by['kdp-reports'].recovery, 'node .claude/scripts/measurement/refresh-session.mjs kdp --wait-human');
    assert.equal(by.gsc.recovery, '人がログインする');
    assert.doesNotMatch(JSON.stringify(result), /SECRET-FIXTURE/);

    writePreflight(root, result);
    assert.deepEqual(JSON.parse(readFileSync(join(root, PREFLIGHT_FILE), 'utf8')), result);

    // 通知: 期限が近い・切れている・失敗印ありだけを数え、文に復旧コマンドを入れる
    const alerts = preflightAlerts(result);
    assert.deepEqual(alerts.map((a) => a.source), ['a8', 'note', 'x', 'kdp-reports']);
    const text = notificationText(alerts);
    assert.match(text, /refresh-session\.mjs a8 --wait-human/);
    assert.match(text, /ほか 3 件/);
    assert.equal(notificationText([]), null);

    // agent 向けは状態と期限だけ (理由と復旧の文字列はあるが、cookie の名前・値は出さない)
    const view = agentView(result);
    assert.deepEqual(Object.keys(view.sources[0]).sort(), ['expiresAt', 'lastSuccessAt', 'reason', 'recovery', 'source', 'state', 'usable']);
    assert.equal(view.sources.find((s) => s.source === 'a8').usable, true);
    assert.equal(view.sources.find((s) => s.source === 'x').usable, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// 意図: 正本の sessions が資格情報の全サービスを覆い、Threads と KDP レポートを足し、復旧コマンドが実在する LOGIN を指す。
test('正本の sessions は資格情報の全サービス + Threads + KDP レポートを持ち、復旧先は refresh-session の LOGIN にある', () => {
  const ids = sessionDefinitions().map(([id]) => id);
  for (const service of Object.keys(credentialServices())) assert.ok(ids.includes(service), service);
  assert.ok(ids.includes('threads') && ids.includes('kdp-reports'));
  for (const [id, d] of sessionDefinitions()) {
    if (d.refreshSource) assert.ok(LOGIN[d.refreshSource], `${id}: ${d.refreshSource}`);
    else assert.ok(d.recoveryNote, `${id}: 復旧の手段`);
    assert.ok(d.unreadable || (d.domains?.length && (d.profile || d.state)), `${id}: 読む場所か、読めない理由`);
  }
});

// 意図: 日次の確認はブラウザを起動せず、ネットワークに出ず、ファイルを読むだけ。
test('事前確認と日次スクリプトはブラウザもネットワークも使わない', () => {
  const src = readFileSync('.claude/scripts/measurement/session-preflight.mjs', 'utf8');
  assert.doesNotMatch(src, /from 'playwright'|import\('playwright'\)|launchPersistentContext|fetch\(|node:https?|readCredential|security'/);
  const sh = readFileSync('scripts/scheduled/session-preflight.sh', 'utf8').split('\n').filter((line) => !line.startsWith('#')).join('\n');
  assert.match(sh, /session-preflight\.mjs --write --notify/);
  assert.doesNotMatch(sh, /refresh-session|collect|curl|git /);
  assert.ok(existsSync('scripts/scheduled/com.stats47.session-preflight.plist'));
});

// 意図: health.mjs --check の終了コードは収集状態だけで決まる。事前確認の「切れている」を混ぜて既存の判定を変えない。
test('measurement:status --check の判定は事前確認に左右されない', () => {
  const root = fixtureRoot();
  try {
    const now = new Date().toISOString();
    const sources = ['a8', 'note', 'gsc', 'kdp', 'rakuten'].map((source) => ({ source, status: 'pass', observedAt: now, metricsAvailable: true,
      capability: { a8: 'site-outcomes', note: 'dashboard-metrics', gsc: 'verified-coverage-export', kdp: 'publication-daily-and-monthly-royalties', rakuten: 'monthly-outcomes' }[source] }));
    writeFileSync(join(root, 'data/authenticated/latest.json'), JSON.stringify({ generatedAt: now, sources }));
    writeFileSync(join(root, '.local/authenticated-measurement/note.autologin-failed'), `${now} login_failed\n`);
    const run = (...extra) => spawnSync(process.execPath, ['.claude/scripts/measurement/health.mjs', '--root', root, ...extra], { encoding: 'utf8' });
    const pass = run('--check');
    assert.equal(pass.status, 0, pass.stderr);
    assert.match(pass.stdout, /保存済みセッションの事前確認/);
    assert.match(pass.stdout, /\| note \| 自動ログイン失敗の印あり/);
    const json = JSON.parse(run('--preflight', '--json').stdout);
    assert.equal(json.sources.find((s) => s.source === 'note').state, 'autologin_failed');
    writeFileSync(join(root, 'data/authenticated/latest.json'), JSON.stringify({ generatedAt: now, sources: sources.slice(1) }));
    assert.equal(run('--check').status, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
