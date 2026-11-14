#!/usr/bin/env node
/**
 * session-preflight.mjs — ログインが要るサービスの保存済みセッションを、切れる前に確かめる (読み取り専用)。
 *
 * ブラウザを開かず、ネットワークにも出ない。専用プロファイルの Cookies (SQLite) か storageState の JSON から
 * 「認証 cookie の名前と期限」だけを取り出し、失敗印 (`.local/authenticated-measurement/<source>.autologin-failed`) と
 * 最後に成功した取得の時刻を合わせて、取得元ごとに 5 つの状態へ分ける。
 *   valid (有効) / expiring (期限が近い・既定 3 日以内) / expired (切れている) / autologin_failed (自動ログイン失敗の印あり) / unknown (確認できない)
 * cookie の値は読まない (SQLite は名前・期限の列だけを SELECT し、storageState は読んだ直後に名前・期限だけへ写す)。
 * cookie の期限は上限で、提供元がサーバー側で先に切ることがある。valid は「保存済みの cookie がまだ期限内」の意味で、ログインの証明ではない。
 *
 * 対象と認証 cookie の名前の正本は `.claude/config/auth-credentials.json` の `sessions`。
 * 日次の通知は `scripts/scheduled/session-preflight.sh` (launchd)。agent は `npm run measurement:status -- --preflight --json` で読む。
 *
 * Usage: session-preflight.mjs [--root PATH] [--json] [--write] [--notify] [--warn-days N]
 *   --write  : 結果を .local/session-preflight/latest.json に置く (管理画面 /ops/auth が読む)
 *   --notify : 期限が近い・切れている・失敗印ありの取得元があれば macOS の通知を出す
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { datasetPath } from '../../../config/datasets.mjs';
import { ALERT_STATES, PREFLIGHT_DIR, PREFLIGHT_FILE, STATE_LABELS, formatJst } from './session-states.mjs';

export { ALERT_STATES, PREFLIGHT_DIR, PREFLIGHT_FILE, STATE_LABELS, formatJst };

export const DEFAULT_WARN_DAYS = 3;
const DAY_MS = 86400000;
/** Chromium の expires_utc は 1601-01-01 からのマイクロ秒。Unix 起点との差 (ミリ秒) */
const CHROME_EPOCH_OFFSET_MS = 11644473600000;
const CONFIG_URL = new URL('../../config/auth-credentials.json', import.meta.url);

/**
 * @typedef {{ label: string, refreshSource?: string, failMark?: string, profile?: string, state?: string, domains?: string[],
 *   authCookies?: string[], unreadable?: string, recoveryNote?: string, lastSuccess?: { measurement?: string, log?: string } }} SessionDef
 * @typedef {{ name: string, domain: string, expiresAt: number | null }} CookieMeta  expiresAt は Unix ミリ秒。null はセッション cookie
 */

/** 正本の sessions を [id, def] の配列で返す (`_comment` を除く) */
export function sessionDefinitions(config = JSON.parse(readFileSync(CONFIG_URL, 'utf8'))) {
  return Object.entries(config.sessions ?? {}).filter(([id]) => !id.startsWith('_'))
    .map(([id, def]) => /** @type {[string, SessionDef]} */ ([id, def]));
}

/** 復旧コマンド。refresh-session.mjs が扱う取得元はオーナーが打つ --wait-human、それ以外は recoveryNote */
export function recoveryFor(def) {
  return def.refreshSource ? `node .claude/scripts/measurement/refresh-session.mjs ${def.refreshSource} --wait-human` : (def.recoveryNote ?? null);
}

export function chromeTimeToMs(expiresUtc) {
  const value = Number(expiresUtc);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value / 1000 - CHROME_EPOCH_OFFSET_MS);
}

const inDomains = (domain, domains) => {
  const host = String(domain ?? '').replace(/^\./, '');
  return domains.some((root) => host === root || host.endsWith(`.${root}`));
};

/** storageState の cookies から、対象 domain の名前と期限だけを写す (値は持ち出さない) */
export function cookiesFromState(state, domains) {
  if (!Array.isArray(state?.cookies)) return null;
  return state.cookies.filter((c) => inDomains(c?.domain, domains)).map((c) => ({
    name: String(c.name), domain: String(c.domain),
    expiresAt: typeof c.expires === 'number' && c.expires > 0 ? Math.round(c.expires * 1000) : null,
  }));
}

/** sqlite3 -json の行 (host_key・name・expires_utc・has_expires) を CookieMeta にする */
export function cookiesFromChromeRows(rows, domains) {
  return rows.filter((r) => inDomains(r.host_key, domains)).map((r) => ({
    name: String(r.name), domain: String(r.host_key),
    expiresAt: Number(r.has_expires) === 0 ? null : chromeTimeToMs(r.expires_utc),
  }));
}

/**
 * 1 取得元の状態を決める純粋関数。
 * @param {{ def: SessionDef, cookies: CookieMeta[] | null, failMark?: { at: string | null } | null, lastSuccessAt?: string | null,
 *   now?: number, warnDays?: number }} input  cookies が null = プロファイル・state が無い
 */
export function classifySession({ def, cookies, failMark = null, lastSuccessAt = null, now = Date.now(), warnDays = DEFAULT_WARN_DAYS }) {
  const base = { expiresAt: null, lastSuccessAt, failedAt: failMark?.at ?? null, recovery: recoveryFor(def) };
  // 失敗印は cookie より先に見る。印がある間は refresh-session が自動で入り直さない (アカウントロック回避) ので、人が要る
  if (failMark) return { ...base, state: 'autologin_failed', reason: '前回の自動ログインが失敗し、人が確認するまで自動で入り直さない' };
  if (def.unreadable) return { ...base, state: 'unknown', reason: def.unreadable };
  if (!def.authCookies?.length) return { ...base, state: 'unknown', reason: '認証 cookie の名前を実機で確かめていない' };
  if (cookies === null) return { ...base, state: 'unknown', reason: 'この端末に専用プロファイル・state が無い' };
  const auth = cookies.filter((c) => def.authCookies.includes(c.name));
  if (!auth.length) return { ...base, state: 'expired', reason: '認証 cookie が無い (ログアウト済みか期限切れで消えた)' };
  const persistent = auth.filter((c) => c.expiresAt !== null);
  if (!persistent.length) return { ...base, state: 'unknown', reason: '認証 cookie がセッション cookie だけで期限を持たない' };
  // 複数ある場合は最も早い期限で判定する (早めに知らせる側へ倒す)
  const expiresAt = Math.min(...persistent.map((c) => c.expiresAt));
  const withExpiry = { ...base, expiresAt: new Date(expiresAt).toISOString() };
  if (expiresAt <= now) return { ...withExpiry, state: 'expired', reason: '認証 cookie の期限が過ぎた' };
  if (expiresAt - now <= warnDays * DAY_MS) return { ...withExpiry, state: 'expiring', reason: `認証 cookie の期限まで ${warnDays} 日以内` };
  return { ...withExpiry, state: 'valid', reason: '認証 cookie が期限内 (提供元がサーバー側で先に切ることはある)' };
}

/** 通知・要対応に数える取得元 */
export function preflightAlerts(result) {
  return result.sources.filter((s) => ALERT_STATES.has(s.state));
}

/** macOS の通知の 1 文。復旧コマンドを入れる (通知は 200 字で切られるので、全件は .local の JSON と /ops/auth で見る) */
export function notificationText(alerts) {
  if (!alerts.length) return null;
  const first = alerts[0];
  const rest = alerts.length > 1 ? ` ほか ${alerts.length - 1} 件 (${alerts.slice(1).map((a) => a.source).join('・')})` : '';
  return `${first.label}: ${STATE_LABELS[first.state]}${first.expiresAt ? ` (${formatJst(first.expiresAt)} まで)` : ''}。復旧: ${first.recovery ?? '管理画面 /ops/auth'}${rest}`;
}

// ---- ファイルを読む部分 (ブラウザを開かない・ネットワークに出ない) ----

function chromeCookieFile(profileDir) {
  return ['Default/Network/Cookies', 'Default/Cookies'].map((p) => join(profileDir, p)).find((p) => existsSync(p)) ?? null;
}

/**
 * プロファイルの Cookies を名前・期限の列だけ読む。値の列 (value / encrypted_value) は SELECT しない。
 * immutable=1 で開くので、ブラウザが開いていてもロックを取らず、ファイルも書き換えない。
 */
export function readProfileCookies(profileDir, domains, { exec = execFileSync } = {}) {
  const file = chromeCookieFile(profileDir);
  if (!file) return null;
  const out = exec('sqlite3', ['-readonly', '-json', `file:${encodeURI(file)}?immutable=1`,
    'SELECT host_key, name, expires_utc, has_expires FROM cookies'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return cookiesFromChromeRows(String(out).trim() ? JSON.parse(String(out)) : [], domains);
}

/** state があれば state、無ければプロファイルを読む (bootstrap-session.mjs と同じ優先順) */
export function readSessionCookies(root, def, options = {}) {
  const domains = def.domains ?? [];
  if (def.state) {
    const statePath = join(root, '.local', def.state);
    if (existsSync(statePath)) return cookiesFromState(JSON.parse(readFileSync(statePath, 'utf8')), domains);
  }
  if (!def.profile) return null;
  const profileDir = join(root, '.local', def.profile);
  return existsSync(profileDir) ? readProfileCookies(profileDir, domains, options) : null;
}

function readFailMark(root, source) {
  const path = join(root, '.local/authenticated-measurement', `${source}.autologin-failed`);
  if (!existsSync(path)) return null;
  const first = readFileSync(path, 'utf8').trim().split(/\s+/)[0];
  return { at: Number.isFinite(Date.parse(first)) ? new Date(first).toISOString() : statSync(path).mtime.toISOString() };
}

/** 最後に成功した取得の時刻。measurement = 台帳 revenue.authenticated (認証付き計測の最新) の pass、log = .local の jsonl の最終行の at */
export function lastSuccessFrom({ def, measurementState = null, logLastLine = null }) {
  if (def.lastSuccess?.measurement) {
    const item = measurementState?.sources?.find((s) => s.source === def.lastSuccess.measurement);
    return item?.status === 'pass' && Number.isFinite(Date.parse(item.observedAt)) ? item.observedAt : null;
  }
  if (def.lastSuccess?.log && logLastLine) {
    try { const at = JSON.parse(logLastLine).at; return Number.isFinite(Date.parse(at)) ? at : null; } catch { return null; }
  }
  return null;
}

function lastLine(path) {
  if (!existsSync(path)) return null;
  const lines = readFileSync(path, 'utf8').split('\n').filter((l) => l.trim());
  return lines.at(-1) ?? null;
}

/**
 * 全取得元の事前確認。ファイルを読むだけ (ブラウザ・ネットワークを使わない)。
 * @param {{ root?: string, now?: number, warnDays?: number, config?: { sessions?: Record<string, unknown> }, exec?: Function }} [options]  config・exec はテスト用
 */
export function runPreflight({ root = '.', now = Date.now(), warnDays = DEFAULT_WARN_DAYS, config = undefined, exec = undefined } = {}) {
  let measurementState = null;
  try { measurementState = JSON.parse(readFileSync(join(root, datasetPath('revenue.authenticated')), 'utf8')); } catch { /* 無ければ最終成功は不明 */ }
  const sources = sessionDefinitions(config).map(([source, def]) => {
    let cookies = null, readError = null;
    try { cookies = def.unreadable ? null : readSessionCookies(root, def, exec ? { exec } : {}); }
    catch (error) { readError = String(error?.message ?? error).split('\n')[0].slice(0, 120); }
    const failMark = readFailMark(root, def.failMark ?? def.refreshSource ?? source);
    const lastSuccessAt = lastSuccessFrom({ def, measurementState, logLastLine: def.lastSuccess?.log ? lastLine(join(root, '.local', def.lastSuccess.log)) : null });
    const result = readError && !failMark
      ? { state: 'unknown', reason: `cookie を読めなかった (${readError})`, expiresAt: null, lastSuccessAt, failedAt: null, recovery: recoveryFor(def) }
      : classifySession({ def, cookies, failMark, lastSuccessAt, now, warnDays });
    return { source, label: def.label, ...result };
  });
  return { schemaVersion: 1, generatedAt: new Date(now).toISOString(), warnDays, sources };
}

export function formatPreflight(result) {
  return [`保存済みセッションの事前確認 (cookie の名前と期限だけを読む。期限は上限で、ログインの証明ではない。期限が近いとみなす日数: ${result.warnDays})`, '',
    '| 取得元 | 状態 | 期限 (日本時間) | 最後に成功した取得 | 理由 | 復旧 |', '|---|---|---|---|---|---|',
    ...result.sources.map((s) => `| ${s.source} | ${STATE_LABELS[s.state]} | ${s.expiresAt ? formatJst(s.expiresAt) : '—'} | ${s.lastSuccessAt ? formatJst(s.lastSuccessAt) : '記録なし'} | ${s.reason} | ${ALERT_STATES.has(s.state) && s.recovery ? `\`${s.recovery}\`` : '—'} |`),
  ].join('\n');
}

/** agent 向けの最小形 (状態と期限だけ) */
export function agentView(result) {
  return { generatedAt: result.generatedAt, warnDays: result.warnDays,
    sources: result.sources.map((s) => ({ source: s.source, state: s.state, usable: s.state === 'valid' || s.state === 'expiring',
      expiresAt: s.expiresAt, lastSuccessAt: s.lastSuccessAt, reason: s.reason, recovery: s.recovery })) };
}

export function writePreflight(root, result) {
  mkdirSync(join(root, PREFLIGHT_DIR), { recursive: true, mode: 0o700 });
  writeFileSync(join(root, PREFLIGHT_FILE), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
}

// CLI。top-level await を使わない (管理画面 apps/admin がこの module を import するため)
async function main(args) {
  if (args.includes('--help')) {
    console.log('Usage: session-preflight.mjs [--root PATH] [--json] [--write] [--notify] [--warn-days N]');
    return;
  }
  const option = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
  const root = resolve(option('--root') ?? fileURLToPath(new URL('../../../', import.meta.url)));
  const warnDays = option('--warn-days') ? Number(option('--warn-days')) : DEFAULT_WARN_DAYS;
  const result = runPreflight({ root, warnDays });
  if (args.includes('--write')) writePreflight(root, result);
  console.log(args.includes('--json') ? JSON.stringify(agentView(result), null, 2) : formatPreflight(result));
  const text = notificationText(preflightAlerts(result));
  if (args.includes('--notify') && text) {
    const { notify } = await import('./refresh-session.mjs');
    notify(`保存済みセッション ${text}`);
  }
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => { console.error(error); process.exitCode = 1; });
}
