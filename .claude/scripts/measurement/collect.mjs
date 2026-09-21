#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceFor, scopedState, failureCode, selectSessionBundle } from './sources.mjs';
import { readVault, writeVault } from './vault.mjs';
import { collectAfbOutcomes } from './afb-outcomes.mjs';
import { kdpMonthlyVaultKey } from './kdp-monthly-reports.mjs';
import { authenticationPause, rejectedAuthentication } from './auth-recovery.mjs';
import { noteInventoryAvailable } from './note-inventory.mjs';

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const name = process.argv[2];
const source = sourceFor(name);
const local = process.argv.includes('--local');
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
  metricsAvailable: false, inventoryAvailable: false, evidence: null, collectionAttempted: false, recovery: null };
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
    let seed;
    if (local) {
      const index = process.argv.indexOf('--bootstrap');
      const path = index < 0 ? null : process.argv[index + 1];
      if (!path) throw new Error('session_missing');
      seed = readFileSync(path, 'utf8');
    } else seed = process.env.MEASUREMENT_SESSION;
    if (seed) bundle = JSON.parse(gunzipSync(Buffer.from(seed, 'base64'), { maxOutputLength: 4 * 1024 * 1024 }));
    if (!local) {
      const remote = await readVault(`${name}/session`);
      bundle = selectSessionBundle(bundle, remote);
    }
    if (!bundle || bundle.source !== name) throw new Error('session_missing');
    if (!local) {
      const pause = authenticationPause(name, bundle, await readVault(`${name}/auth-recovery`), await readVault(`${name}/latest-attempt`));
      if (pause) {
        await writeVault(`${name}/auth-recovery`, pause);
        result.recovery = { state: 'awaiting_reauthentication', blockedSince: pause.blockedSince };
        throw new Error('auth_required: awaiting_new_human_session');
      }
    }
    writeFileSync(join(work, 'state.json'), JSON.stringify(scopedState(name, bundle.state)), { mode: 0o600 });
    if (name === 'kdp') {
      if (!/^B0[A-Z0-9]{8}$/.test(bundle.account?.knownAsin ?? '')) throw new Error('account_mismatch');
      writeFileSync(join(ROOT, '.local/kdp-account.local.json'), JSON.stringify(bundle.account), { mode: 0o600 });
    }
  }
  result.collectionAttempted = true;
  if (name === 'moshimo') {
    await command('.claude/scripts/ads/moshimo-report.mjs');
    await command('.claude/scripts/ads/moshimo-report.mjs', ['--check']);
    capture('.claude/state/metrics/affiliate/moshimo-results.json');
  } else if (name === 'a8') {
    const yesterday = new Date(Date.now() + 9 * 3600000 - 86400000).toISOString().slice(0, 10);
    await command('.claude/scripts/ads/fetch-a8-ui-csv.mjs', ['--reports', 'site-summary', '--month', yesterday.slice(0, 7)]);
    const marker = JSON.parse(readFileSync(join(ROOT, '.claude/state/metrics/affiliate/a8-ui-last-run.json')));
    if (marker.status !== 'ok' || marker.downloadedUnits !== 1 || marker.collectedAt < now) throw new Error('collection_incomplete');
    await command('.claude/scripts/ads/normalize-a8-csv.mjs', ['--run', marker.lastRun]);
    const normalized = join(ROOT, '.local/a8-ui', marker.lastRun, 'normalized');
    for (const file of readdirSync(normalized).filter(f => f.endsWith('.rejects.json'))) {
      if (JSON.parse(readFileSync(join(normalized, file))).length) throw new Error('reject_rows');
    }
    capture(`.local/a8-ui/${marker.lastRun}`);
    for (const file of ['a8-ui-last-run.json', 'a8-results.json', 'a8-report-log.json']) capture(`.claude/state/metrics/affiliate/${file}`);
  } else if (name === 'afb') {
    const config = JSON.parse(readFileSync(join(ROOT, '.claude/config/affiliate-asp.json'), 'utf8'));
    const outcomes = await collectAfbOutcomes({ config, apiKey: process.env.AFB_API_KEY, now: new Date(now) });
    for (const [file, value] of Object.entries({ 'outcomes.json': outcomes.report, 'raw.json': outcomes.raw })) {
      writeFileSync(join(work, file), JSON.stringify(value), { mode: 0o600 });
      capture(`.local/authenticated-measurement/${name}-${runId}/${file}`);
    }
    result.quality = { siteVerified: true, occurrenceRows: outcomes.report.coverage.occurrence, recognitionRows: outcomes.report.coverage.recognition };
  } else if (name === 'note') {
    await command('.claude/scripts/note/audit-note-covers.mjs', [], 360000, [1]);
    await command('.claude/scripts/note/fetch-note-metrics.mjs', ['--output-dir', join(work, 'note')], 360000, [2]);
    capture(`.local/authenticated-measurement/${name}-${runId}/note`);
    const snapshot = JSON.parse(readFileSync(join(work, 'note/latest.json')));
    const cover = JSON.parse(readFileSync(join(work, 'note/cover-metrics-latest.json')));
    result.quality = { expectedRows: snapshot.coverage?.catalogPublished ?? null, observedRows: snapshot.coverage?.observed ?? null,
      missingRows: snapshot.coverage?.missingFromDashboard?.length ?? null, totalsMatched: snapshot.coverage?.totalsMatched === true,
      paginationComplete: snapshot.coverage?.paginationComplete === true };
    result.inventoryAvailable = noteInventoryAvailable(snapshot, cover);
    if (snapshot.status !== 'pass' || cover.status !== 'pass') {
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
    capture('.claude/state/metrics/gsc/coverage-drilldown');
  } else {
    await command('.claude/scripts/measurement/marketplace-status.mjs', [name, join(work, 'status.json')], 900000);
    capture(`.local/authenticated-measurement/${name}-${runId}/status.json`);
    if (name === 'kdp') {
      capture(`.local/authenticated-measurement/${name}-${runId}/status.xlsx`);
      const monthlyPath = `.local/authenticated-measurement/${name}-${runId}/status.monthly.xlsx`;
      capture(monthlyPath);
      const monthly = JSON.parse(readFileSync(join(work, 'status.json'), 'utf8')).monthlyRoyalties;
      if (monthly?.finality !== 'finalized-monthly-royalty' || !monthly.coverage?.complete) throw new Error('report_incomplete: monthly_missing');
      result.quality = { monthlyPeriod: monthly.period.month, monthlyRows: monthly.coverage.includedRows, monthlyComplete: true };
      if (!local) await writeVault(kdpMonthlyVaultKey(monthly.period.month), {
        schemaVersion: 1, source: 'kdp', observedAt: now, report: monthly, workbook: files[monthlyPath],
      });
    }
  }
  const evidence = { schemaVersion: 1, source: name, observedAt: now, files, logs };
  writeFileSync(join(work, 'evidence.json'), JSON.stringify(evidence), { mode: 0o600 });
  if (!local) {
    result.evidence = await writeVault(historyKey, evidence);
    await writeVault(`${name}/latest-success`, evidence);
    if (existsSync(join(work, 'refreshed.json'))) {
      await writeVault(`${name}/session`, { ...bundle, capturedAt: new Date().toISOString(), state: scopedState(name, JSON.parse(readFileSync(join(work, 'refreshed.json')))) });
    }
  }
  result.status = 'pass';
  result.metricsAvailable = !['publication-status', 'account-status', 'partnership-status'].includes(source.capability);
} catch (error) {
  result.code = failureCode(error.message);
  if (name === 'note' && existsSync(join(work, 'note'))) capture(`.local/authenticated-measurement/${name}-${runId}/note`);
  // Raw diagnostics stay in a private encrypted object. Only fixed codes reach public Actions logs.
  writeFileSync(join(work, 'failure.log'), `${error.message}\n${logs}`, { mode: 0o600 });
  if (!local) {
    try {
      if (result.code === 'auth_required' && result.collectionAttempted && bundle) {
        const recovery = rejectedAuthentication(name, bundle, now);
        await writeVault(`${name}/auth-recovery`, recovery);
        result.recovery = { state: 'awaiting_reauthentication', blockedSince: recovery.blockedSince };
      }
      // Keep the last real browser failure in its history slot while waiting for the owner.
      result.evidence = await writeVault(result.collectionAttempted ? historyKey : `${name}/latest-blocked`,
        { source: name, observedAt: now, collectionAttempted: result.collectionAttempted, message: error.message, files, logs });
    }
    catch { result.code = 'storage_error'; }
  }
}
if (!local) {
  // A complete account assertion can refresh authentication even when a report has missing rows.
  if (bundle && existsSync(join(work, 'refreshed.json.verified')) && existsSync(join(work, 'refreshed.json'))) {
    try { await writeVault(`${name}/session`, { ...bundle, capturedAt: new Date().toISOString(), state: scopedState(name, JSON.parse(readFileSync(join(work, 'refreshed.json')))) }); }
    catch { result.status = 'failed'; result.code = 'storage_error'; }
  }
  try { await writeVault(`${name}/latest-attempt`, result); }
  catch { result.status = 'failed'; result.code = 'storage_error'; }
}
// Re-running a job can retain same-named artifacts. Distinct filenames prevent merge races.
writeFileSync(join(publicDir, `${name}-${runAttempt}.json`), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
process.exitCode = result.status === 'pass' ? 0 : 1;
