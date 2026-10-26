#!/usr/bin/env node
/**
 * admin-read-guard.mjs — セッション中のエージェントが、ログインの要る管理画面を「数字を読むために」開くのを止める
 * (2026-10-20 オーナー判断。正典 .claude/rules/recorded-measurement-first.md)。
 *
 * ログインが要る計測は土曜の朝に Mac が取得して data/ に記録する。セッションはその記録から判断し、ブラウザで取りに行かない。
 * ここは「読むための画面」と「読み取りスクリプトの実行」だけを見る。投稿・申請・出品の画面とスクリプトは対象にしない。
 * オーナーが会話で頼んだ取得だけは、許可ファイル (60 分で失効) かコマンド先頭の STATS47_OWNER_REQUESTED=1 で通す。
 *
 * 呼び元: .claude/hooks/pre-browser-admin-read.mjs (ブラウザ MCP) と .claude/hooks/pre-bash-safety.js (Bash)。
 * 許可: node .claude/scripts/measurement/admin-read-guard.mjs --allow "<オーナーの依頼の引用>"
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { datasetDir, datasetPath } from '../../../config/datasets.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const ALLOW_FILE = '.local/owner-browser-allow.json';
const ALLOW_LOG = '.local/owner-browser-allow.log';
const ALLOW_MINUTES = 60;

/** 台帳の id から置き場を引く。可変部分を持つデータセットは「id:ファイル名」で指し、名前が無ければディレクトリ */
const where = (specs) => specs.map((spec) => {
  const [id, name] = spec.split(':');
  if (name) return `${datasetDir(id)}/${name}`;
  try { return datasetPath(id); } catch { return `${datasetDir(id)}/`; }
}).join('・');
const GSC_API = 'ページ×検索語はログイン不要の node .claude/scripts/metrics/gsc-query.mjs';
const GA4_API = '細かい粒度はログイン不要の node .claude/scripts/metrics/ga4-query.mjs';

/** 読むための管理画面と、代わりに読む記録。X は週次の記録が無いので対象外 (X-METRICS-WEEKLY-RECORD-01) */
export const ADMIN_READ_PAGES = [
  { name: 'A8', pattern: /^https?:\/\/(pub|www)\.a8\.net\//i, records: where(['a8.results', 'a8.catalog']) },
  { name: '楽天アフィリエイトのレポート', pattern: /^https?:\/\/affiliate\.rakuten\.co\.jp\/report/i, records: where(['rakuten.results']) },
  { name: 'note のダッシュボード', pattern: /^https?:\/\/note\.com\/(dashboard|sitesettings\/stats)/i, records: where(['note.dashboard:latest.json', 'revenue.authenticated:revenue-history.json']) },
  { name: 'KDP のレポート', pattern: /^https?:\/\/kdpreports\.amazon\.(co\.jp|com)\//i, records: where(['revenue.authenticated:revenue-history.json', 'sales.ledger']) },
  { name: 'Search Console', pattern: /^https?:\/\/search\.google\.com\/search-console/i, records: `${where(['gsc.latest', 'gsc.coverage-drilldown'])} (${GSC_API})` },
  { name: 'GA4', pattern: /^https?:\/\/analytics\.google\.com\//i, records: `${where(['ga4.latest'])} (${GA4_API})` },
  { name: 'AdSense', pattern: /^https?:\/\/(www\.)?adsense\.google\.com\//i, records: `${datasetDir('adsense.reports')}/LATEST.md` },
];

/** 管理画面を読むスクリプトの実行 (node / tsx / bash から起動したときだけ。grep や cat で名前に触れるのは止めない) */
const READ_SCRIPTS = [
  { name: 'A8 のレポート', pattern: /(?:fetch-a8-ui-csv)\.mjs\b/, records: where(['a8.results']) },
  { name: 'A8 の提携状態', pattern: /a8-browser\.ts\s+check-approval\b/, records: where(['a8.catalog']) },
  { name: 'ASP の提携状態', pattern: /affiliate-status\.mjs\b/, records: where(['affiliate.catalog']) },
  { name: '楽天アフィリエイトのレポート', pattern: /rakuten-report\.mjs\b/, records: where(['rakuten.results']) },
  { name: 'KDP のレポート', pattern: /kdp-reports-probe\.mjs\b/, records: where(['revenue.authenticated:revenue-history.json', 'sales.ledger']) },
  { name: 'note のダッシュボード', pattern: /note\/fetch-note-metrics\.(mjs|sh)\b|\bnote:metrics:fetch\b/, records: where(['note.dashboard:latest.json']) },
  { name: 'Search Console の除外理由', pattern: /export-coverage-playwright\.mjs\b/, records: where(['gsc.coverage-drilldown']) },
  { name: '認証付き計測', pattern: /measurement\/collect(-local)?\.mjs\b|\bmeasurement:collect\b/, records: where(['revenue.authenticated:latest.json']) },
];
const LAUNCHER = /^(?:node|tsx|bash|sh|npx(?:\s+-y)?\s+tsx|npm\s+run)\s/;
const ENV_PREFIX = /^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)+/;

/** コマンドを実行単位に分け、先頭の環境変数の代入を外す。echo やヒアドキュメントの中身で名前に触れるだけなら実行単位の先頭に来ない */
function segments(command) {
  return command.split(/\|\||&&|[;|\n]/).map((part) => {
    const trimmed = part.trim().replace(/^\(+\s*/, '');
    const env = ENV_PREFIX.exec(trimmed)?.[0] ?? '';
    return { env, body: trimmed.slice(env.length) };
  });
}

function allowedByOwner(root, now) {
  const path = join(root, ALLOW_FILE);
  if (!existsSync(path)) return false;
  try { return Date.parse(JSON.parse(readFileSync(path, 'utf8')).expiresAt) > now; } catch { return false; }
}

function denial(name, records) {
  return [
    `[recorded-measurement-first] ${name}を読むためにログインが要る画面を開こうとしています。`,
    'ログインが要る計測は毎週土曜の朝に Mac が取得して記録しています。ブラウザで取りに行かず、まず記録を読んでください:',
    `  ${records}`,
    `  取得の成否と最終観測日: ${datasetDir('revenue.authenticated')}/latest.json`,
    '記録が古い・欠けているときは、最終観測日を添えて「判定不能」と書いて進めます。',
    `オーナーが会話でこの取得を明示的に頼んだときだけ、node .claude/scripts/measurement/admin-read-guard.mjs --allow "<オーナーの依頼の引用>" を実行してから再実行してください (${ALLOW_MINUTES} 分有効)。`,
    '投稿・申請・出品の画面は対象外です。正典: .claude/rules/recorded-measurement-first.md',
  ].join('\n');
}

function collectUrls(value, out = []) {
  if (Array.isArray(value)) { for (const item of value) collectUrls(item, out); return out; }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === 'url' && typeof item === 'string') out.push(item.trim());
      else collectUrls(item, out);
    }
  }
  return out;
}

/** ブラウザ MCP の入力。止めるなら理由の文字列、通すなら null */
export function checkBrowserInput(toolInput, { root = ROOT, now = Date.now() } = {}) {
  for (const url of collectUrls(toolInput)) {
    const page = ADMIN_READ_PAGES.find((p) => p.pattern.test(url));
    if (page && !allowedByOwner(root, now)) return denial(page.name, page.records);
  }
  return null;
}

/** Bash のコマンド。止めるなら理由の文字列、通すなら null */
export function checkBashCommand(command, { root = ROOT, now = Date.now() } = {}) {
  if (typeof command !== 'string') return null;
  for (const { env, body } of segments(command)) {
    if (/\bSTATS47_OWNER_REQUESTED=1\s/.test(env)) continue;
    let hit = null;
    if (LAUNCHER.test(body)) hit = READ_SCRIPTS.find((s) => s.pattern.test(body)) ?? null;
    if (!hit && /^browser-use\s/.test(body)) {
      const urls = body.match(/https?:\/\/[^\s'"<>]+/g) ?? [];
      hit = ADMIN_READ_PAGES.find((p) => urls.some((url) => p.pattern.test(url))) ?? null;
    }
    if (hit && !allowedByOwner(root, now)) return denial(hit.name, hit.records);
  }
  return null;
}

/** オーナーが会話で頼んだ取得を 60 分だけ通す。引用はログに残す */
export function allowOwnerRequest(quote, { root = ROOT, now = Date.now() } = {}) {
  if (!quote?.trim()) throw new Error('オーナーの依頼の引用が要る');
  const record = { quote: quote.trim(), grantedAt: new Date(now).toISOString(), expiresAt: new Date(now + ALLOW_MINUTES * 60000).toISOString() };
  mkdirSync(join(root, '.local'), { recursive: true });
  writeFileSync(join(root, ALLOW_FILE), `${JSON.stringify(record, null, 2)}\n`);
  appendFileSync(join(root, ALLOW_LOG), `${JSON.stringify(record)}\n`);
  return record;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--allow');
  if (index < 0) {
    console.error('Usage: admin-read-guard.mjs --allow "<オーナーの依頼の引用>"');
    process.exit(2);
  }
  const record = allowOwnerRequest(process.argv[index + 1]);
  console.log(`管理画面の読み取りを ${record.expiresAt} まで許可した (引用: ${record.quote})`);
}
