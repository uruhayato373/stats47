#!/usr/bin/env node
/** Finalized GSC query × canonical page; never scrape search result HTML. */
import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { resolveServiceAccountKeyFile } from '../metrics/lib/auth.mjs';
import { resolvePeriods, assessDailyCoverage } from '../metrics/lib/periods.mjs';
import { sitePath, validateSnapshot } from './lib/keyword-cycle.mjs';

export async function fetchRows(client, period, dimensions) {
  const rows = [];
  for (let startRow = 0; startRow < 250000; startRow += 25000) {
    const { data } = await client.searchanalytics.query({ siteUrl: 'sc-domain:stats47.jp', requestBody: {
      startDate: period.periodStart, endDate: period.periodEnd, dimensions,
      dataState: 'final', type: 'web', rowLimit: 25000, startRow,
    } }, { timeout: 60000 });
    const batch = data.rows ?? []; rows.push(...batch);
    if (batch.length < 25000) return rows;
  }
  throw new Error('GSC pagination limit reached; partial data cannot be used');
}
export async function fetchSnapshot(client, now = new Date()) {
  const periods = resolvePeriods({ source: 'gsc', now });
  const snapshot = { schemaVersion: 1, siteUrl: 'sc-domain:stats47.jp', asOf: periods.anchor,
    generatedAt: now.toISOString(), limitations: ['GSC reports average position, not a universal SERP rank.',
      'Anonymous and omitted query rows are unknown, never rank zero.'], current: null, previous: null };
  for (const [key, period] of [['current', periods.finalized7d], ['previous', periods.previous7d]]) {
    const [queryRows, daily] = await Promise.all([fetchRows(client, period, ['query', 'page']), fetchRows(client, period, ['date'])]);
    const rows = queryRows.flatMap(row => {
      assert.ok(Array.isArray(row.keys) && row.keys.length === 2, 'invalid GSC dimensions');
      try { return [{ keyword: row.keys[0], targetPath: sitePath(row.keys[1]), rank: row.position, impressions: row.impressions, clicks: row.clicks }]; }
      catch { return []; } // Search-param variants are not alternate canonical targets.
    });
    snapshot[key] = { period, dataState: 'final', coverage: assessDailyCoverage(period, daily.map(row => row.keys[0])), excludedNonCanonicalRows: queryRows.length - rows.length, rows };
  }
  validateSnapshot(snapshot, periods.anchor);
  return snapshot;
}
async function main() {
  const args = process.argv.slice(2), option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
  if (option('--days', '7') !== '7') throw new Error('Keyword effects require exactly 7 days');
  const repo = path.resolve(option('--repo', path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')));
  const keyFile = resolveServiceAccountKeyFile();
  const auth = new google.auth.GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  let snapshot;
  try { snapshot = await fetchSnapshot(google.searchconsole({ version: 'v1', auth })); }
  finally { if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON) fs.rmSync(keyFile, { force: true }); }
  const output = path.join(repo, '.local/seo-rank-watch/gsc.json');
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`GSC finalized7d ${snapshot.current.period.periodStart}..${snapshot.current.period.periodEnd}: ${snapshot.current.rows.length} query/page rows`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => { console.error('GSC rank fetch failed; no ranking state was changed. Check credentials/API availability without exposing secrets.'); process.exitCode = 1; });
