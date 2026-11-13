#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceFor, scopedState, failureCode } from './sources.mjs';
import { writeVault } from './vault.mjs';
import { kdpMonthlyVaultKey } from './kdp-monthly-reports.mjs';
import { kdpDailyRows } from './kdp-reports.mjs';
import { kdpMonthlyObservations } from '../../../packages/product-factory/src/sales/ledger-core.mjs';
import { acceptedNoteGap, noteInventoryAvailable } from './note-inventory.mjs';
import { datasetDir, datasetPath } from "../../../config/datasets.mjs";

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const name = process.argv[2];
const source = sourceFor(name);
// 取得は Mac だけが行う (collect-local.mjs。2026-10-20 に CI の取得を撤去)。セッションは Mac の専用プロファイルから
// 取り出したもの (--bootstrap) だけを使い、保管庫にはセッションを置かない。
// --vault: 証跡・販売台帳の候補・直近の試行を private R2 の保管庫へ書く (restore.mjs が読む)。付けなければ手元の試し実行。
const vaultWrites = process.argv.includes('--vault');
const now = new Date().toISOString();
const runId = process.env.GITHUB_RUN_ID || String(Date.now());
const runAttempt = Number(process.env.GITHUB_RUN_ATTEMPT || 1);
if (!Number.isSafeInteger(runAttempt) || runAttempt < 1) throw new Error('invalid_run_attempt');
// Bounded private history: one overwritable slot per UTC day in a 30-day ring.
const historyKey = `${name}/runs/day-${Math.floor(Date.now() / 86400000) % 30}`;
const work = join(ROOT, '.local/authenticated-measurement', `${name}-${runId}`);
const publicDir = join(ROOT, '.local/authenticated-ci-public');
mkdirSync(work, { recursive: true, mode: 0o700 });
mkdirSync(publicDir, { recursive: true });
const result = { schemaVersion: 1, source: name, capability: source.capability, observedAt: now, status: 'failed', code: null, runId, runAttempt,
  metricsAvailable: false, inventoryAvailable: false, evidence: null, collectionAttempted: false };
let logs = '';
let bundle;
const files = {};
function capture(path) {
  const absolute = resolve(ROOT, path);
  if (!absolute.startsWith(`${ROOT}/`) || !existsSync(absolute)) throw new Error('evidence_missing');
  const stat = lstatSync(absolute);
  if (stat.isSymbolicLink()) throw new Error('evidence_symlink_rejected');
  if (stat.isDirectory()) {
    for (const entry of readdirSync(absolute)) capture(join(path, entry));
  } else {
    if (stat.size > 25 * 1024 * 1024) throw new Error('evidence_too_large');
    files[path] = readFileSync(absolute).toString('base64');
  }
}
async function command(script, args = [], timeout = 360000, acceptedCodes = []) {
  try {
    const { stdout, stderr } = await run(process.execPath, [script, ...args], { cwd: ROOT, env: {
      ...process.env, MEASUREMENT_BROWSER_SOURCE: name,
      MEASUREMENT_BROWSER_STATE_PATH: join(work, 'state.json'), MEASUREMENT_BROWSER_OUTPUT_STATE_PATH: join(work, 'refreshed.json'),
    }, timeout, maxBuffer: 12 * 1024 * 1024 });
    logs += stdout + stderr;
  } catch (error) {
    logs += (error.stdout || '') + (error.stderr || '');
    if (acceptedCodes.includes(error.code)) return;
    throw new Error(`${error.killed ? 'timeout' : 'collector_failed'} ${logs.slice(-8000)}`);
  }
}
try {
  if (source.transport !== 'api') {
    const index = process.argv.indexOf('--bootstrap');
    const path = index < 0 ? null : process.argv[index + 1];
    if (!path) throw new Error('session_missing');
    const seed = readFileSync(path, 'utf8');
    if (seed) bundle = JSON.parse(/** @type {any} */ (gunzipSync(Buffer.from(seed, 'base64'), { maxOutputLength: 4 * 1024 * 1024 })));
    if (!bundle || bundle.source !== name) throw new Error('session_missing');
    writeFileSync(join(work, 'state.json'), JSON.stringify(scopedState(name, bundle.state)), { mode: 0o600 });
    if (name === 'kdp') {
      if (!/^B0[A-Z0-9]{8}$/.test(bundle.account?.knownAsin ?? '')) throw new Error('account_mismatch');
      writeFileSync(join(ROOT, '.local/kdp-account.local.json'), JSON.stringify(bundle.account), { mode: 0o600 });
    }
  }
  result.collectionAttempted = true;
  if (name === 'a8') {
    const yesterday = new Date(Date.now() + 9 * 3600000 - 86400000).toISOString().slice(0, 10);
    await command('.claude/scripts/ads/fetch-a8-ui-csv.mjs', ['--reports', 'site-summary', '--month', yesterday.slice(0, 7)]);
    const marker = JSON.parse(/** @type {any} */ (readFileSync(join(ROOT, datasetPath("a8.ui-last-run")))));
    if (marker.status !== 'ok' || marker.downloadedUnits !== 1 || marker.collectedAt < now) throw new Error('collection_incomplete');
    await command('.claude/scripts/ads/normalize-a8-csv.mjs', ['--run', marker.lastRun]);
    const normalized = join(ROOT, '.local/a8-ui', marker.lastRun, 'normalized');
    for (const file of readdirSync(normalized).filter(f => f.endsWith('.rejects.json'))) {
      if (JSON.parse(/** @type {any} */ (readFileSync(join(normalized, file)))).length) throw new Error('reject_rows');
    }
    capture(`.local/a8-ui/${marker.lastRun}`);
    for (const file of ['a8-ui-last-run.json', 'a8-results.json', 'a8-report-log.json']) capture(`${datasetDir("affiliate.audits")}/${file}`);
  } else if (name === 'rakuten') {
    await command('.claude/scripts/ads/rakuten-report.mjs');
    capture(datasetPath("rakuten.results"));
  } else if (name === 'note') {
    // 売上と販売履歴は、パスワードの再確認を通したセッションでだけ読める。再確認は約 30 分で切れるので、
    // 表紙の監査と閲覧数の取得 (合わせて十数分) より先に読む (2026-11-14。11-08 は後に読んで売上だけ落ちた)。
    // 読めなくても閲覧数の収集は失敗にしない (値は作らない)。
    let sales = null;
    let salesStatus = 'collection_failed';
    try {
      await command('.claude/scripts/measurement/note-sales.mjs', [join(work, 'sales.json')], 180000);
      capture(`.local/authenticated-measurement/${name}-${runId}/sales.json`);
      sales = JSON.parse(readFileSync(join(work, 'sales.json'), 'utf8'));
      salesStatus = sales.status === 'pass' ? 'pass' : sales.code;
    } catch { sales = null; }
    await command('.claude/scripts/note/audit-note-covers.mjs', [], 360000, [1]);
    await command('.claude/scripts/note/fetch-note-metrics.mjs', ['--output-dir', join(work, 'note')], 360000, [2]);
    capture(`.local/authenticated-measurement/${name}-${runId}/note`);
    const snapshot = JSON.parse(/** @type {any} */ (readFileSync(join(work, 'note/latest.json'))));
    const cover = JSON.parse(/** @type {any} */ (readFileSync(join(work, 'note/cover-metrics-latest.json'))));
    result.quality = { expectedRows: snapshot.coverage?.catalogPublished ?? null, observedRows: snapshot.coverage?.observed ?? null,
      missingRows: snapshot.coverage?.missingFromDashboard?.length ?? null, totalsMatched: snapshot.coverage?.totalsMatched === true,
      paginationComplete: snapshot.coverage?.paginationComplete === true };
    result.inventoryAvailable = noteInventoryAvailable(snapshot, cover);
    result.quality.revenue = sales?.status === 'pass' ? sales.revenue : null;
    result.quality.revenueStatus = salesStatus;
    result.quality.revenueEvidenceAvailable = sales?.status === 'pass';
    // 収益の明細 (日 × 記事)。販売履歴が読めたときだけ渡す
    result.quality.daily = sales?.status === 'pass' ? sales.daily ?? null : null;
    if (sales?.dailyCode) result.quality.dailyCode = sales.dailyCode;
    const gap = acceptedNoteGap(snapshot, cover);
    if (gap) result.knownIncomplete = gap;
    else if (snapshot.status !== 'pass' || cover.status !== 'pass') {
      const messages = JSON.stringify(snapshot.issues);
      const code = failureCode(messages);
      throw new Error(code === 'collection_failed' ? 'collection_incomplete' : code);
    }
  } else if (name === 'gsc') {
    const dest = join(work, 'coverage');
    await command('.claude/scripts/gsc/export-coverage-playwright.mjs', ['--dest', dest], 600000);
    capture(`.local/authenticated-measurement/${name}-${runId}/coverage`);
    const { stdout, stderr } = await run('python3', ['.claude/scripts/gsc/ingest-gsc-export.py', '--src', dest, '--require-actionable'], { cwd: ROOT, timeout: 60000 });
    logs += stdout + stderr;
    capture(datasetDir("gsc.coverage-drilldown"));
  } else {
    await command('.claude/scripts/measurement/marketplace-status.mjs', [name, join(work, 'status.json')], 900000);
    capture(`.local/authenticated-measurement/${name}-${runId}/status.json`);
    // 週次の実売 (revenue-history.json) の入力。summarize.mjs が quality.revenue を日次の履歴へ足す。
    const status = JSON.parse(readFileSync(join(work, 'status.json'), 'utf8'));
    if (name === 'kdp') {
      capture(`.local/authenticated-measurement/${name}-${runId}/status.xlsx`);
      const monthlyPath = `.local/authenticated-measurement/${name}-${runId}/status.monthly.xlsx`;
      capture(monthlyPath);
      const monthly = JSON.parse(readFileSync(join(work, 'status.json'), 'utf8')).monthlyRoyalties;
      if (monthly?.finality !== 'finalized-monthly-royalty' || !monthly.coverage?.complete) throw new Error('report_incomplete: monthly_missing');
      const daily = status.sales;
      const jpy = (daily?.records ?? []).filter(r => r.kind === 'estimated-ebook-royalty');
      const dailyRevenue = daily?.coverage?.complete === true && daily.period?.start === daily.period?.end
        && jpy.every(r => r.currency === 'JPY')
        ? { date: daily.period.end, royaltyYen: jpy.reduce((sum, r) => sum + (r.amount ?? 0), 0),
          paidOrders: daily.records.filter(r => r.kind === 'processed-orders').reduce((sum, r) => sum + (r.paid ?? 0), 0) }
        : null;
      // 収益の明細 (data/revenue/daily) の入力。書籍 × 日 × 種類の行を summarize.mjs が台帳へ入れる。
      // 円以外のロイヤリティがある・レポートが不完全なら渡さない (明細に書かない)。
      const dailyRows = daily?.coverage?.complete === true ? kdpDailyRows(daily, now) : null;
      result.quality = { monthlyPeriod: monthly.period.month, monthlyRows: monthly.coverage.includedRows, monthlyComplete: true, revenue: dailyRevenue,
        daily: dailyRows ? { channel: 'kdp', start: daily.period.start, end: daily.period.end, rows: dailyRows } : null };
      if (vaultWrites) {
        const vaultKey = kdpMonthlyVaultKey(monthly.period.month);
        await writeVault(vaultKey, {
          schemaVersion: 1, source: 'kdp', observedAt: now, report: monthly, workbook: files[monthlyPath],
        });
        // 販売台帳の候補。書籍ごとの集計値と保管庫キー・内容ハッシュだけを公開の結果へ出し、生の明細は保管庫に残す。
        // 台帳への書き込みは summarize.mjs が重複なしで行う。
        result.quality.salesLedger = { month: monthly.period.month, vaultKey,
          ...kdpMonthlyObservations(monthly, { vaultKey, recordedAt: now }) };
      }
    }
  }
  const evidence = { schemaVersion: 1, source: name, observedAt: now, files, logs };
  writeFileSync(join(work, 'evidence.json'), JSON.stringify(evidence), { mode: 0o600 });
  if (vaultWrites) {
    result.evidence = await writeVault(historyKey, evidence);
    await writeVault(`${name}/latest-success`, evidence);
  }
  result.status = 'pass';
  result.metricsAvailable = !['publication-status', 'account-status', 'partnership-status'].includes(source.capability);
} catch (error) {
  result.code = failureCode(error.message);
  if (name === 'note' && existsSync(join(work, 'note'))) capture(`.local/authenticated-measurement/${name}-${runId}/note`);
  // Raw diagnostics stay in a private encrypted object. Only fixed codes reach the git record.
  writeFileSync(join(work, 'failure.log'), `${error.message}\n${logs}`, { mode: 0o600 });
  if (vaultWrites) {
    try {
      // Keep the last real browser failure in its history slot; a run that never reached the browser goes to latest-blocked.
      result.evidence = await writeVault(result.collectionAttempted ? historyKey : `${name}/latest-blocked`,
        { source: name, observedAt: now, collectionAttempted: result.collectionAttempted, message: error.message, files, logs });
    }
    catch { result.code = 'storage_error'; }
  }
}
if (vaultWrites) {
  try { await writeVault(`${name}/latest-attempt`, result); }
  catch { result.status = 'failed'; result.code = 'storage_error'; }
}
// summarize.mjs picks the highest attempt per source from this directory.
writeFileSync(join(publicDir, `${name}-${runAttempt}.json`), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
process.exitCode = result.status === 'pass' ? 0 : 1;
