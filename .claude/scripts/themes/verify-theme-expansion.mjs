#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { explicitIndicatorCodes, summarizeSeries, validateDecisions, validateImplementationPlan, PREFECTURES, numericValue } from './theme-expansion-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(import.meta.url);
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { THEME_CATALOGS } = require('../../../packages/data-configs/src/theme-catalog/index.ts');
const catalogPath = path.join(ROOT, '.claude/skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json');
const reportPath = path.join(ROOT, '.claude/state/estat/theme-expansion-verification.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const sha256 = (content) => createHash('sha256').update(content).digest('hex');
const array = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
const definitions = Object.values(METRICS_REGISTRY);

if (process.argv.includes('--check')) {
  const errors = validateDecisions(catalog, THEME_CATALOGS);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const expected = [...new Set(catalog.themes.flatMap(explicitIndicatorCodes))].sort();
  if (JSON.stringify(expected) !== JSON.stringify(report.requestedCodes)) errors.push('Verification coverage differs from candidate codes');
  if (expected.some((code) => !report.series.some((series) => series.code === code))) errors.push('Missing verification result');
  if (report.failures.length || report.series.length !== expected.length || new Set(report.series.map((row) => row.code)).size !== expected.length) errors.push('Incomplete or duplicate API verification');
  errors.push(...validateImplementationPlan(catalog, report, METRICS_REGISTRY));
  const counts = catalog.themes.reduce((result, theme) => { const key = theme.decision?.disposition; result[key] = (result[key] ?? 0) + 1; return result; }, {});
  if (Object.entries(counts).some(([key, value]) => catalog.decisionSummary?.[key] !== value)) errors.push('Stale decision summary');
  for (const response of report.responses) {
    if (!/^[a-f0-9]{64}$/.test(response.sha256) || !response.parameters?.statsDataId || !response.bytes || response.parameters.appId) errors.push('Invalid API evidence manifest');
  }
  console.log(JSON.stringify({ candidates: catalog.themes.length, verifiedCodes: report.series.filter((row) => row.status === 'verified').length, firstBatch: catalog.firstBatch?.length ?? 0, errors }, null, 2));
  process.exitCode = errors.length ? 1 : 0;
} else {
  const appId = process.env.NEXT_PUBLIC_ESTAT_APP_ID || process.env.ESTAT_APP_ID;
  if (!appId) throw new Error('NEXT_PUBLIC_ESTAT_APP_ID or ESTAT_APP_ID is required');
  const requestedCodes = [...new Set(catalog.themes.flatMap(explicitIndicatorCodes))].sort();
  const artifactsArg = process.argv.indexOf('--artifacts');
  const artifacts = artifactsArg >= 0 ? path.resolve(process.argv[artifactsArg + 1]) : '/tmp/stats47-theme-expansion-api';
  fs.mkdirSync(artifacts, { recursive: true });
  const report = {
    schemaVersion: 1, observedAt: new Date().toISOString(), requestedCodes,
    scope: 'Explicit SSDS codes in all 128 candidate definitions; uncoded indicators remain unverified. Raw observations are temporary and are not published.',
    reproduction: 'NEXT_PUBLIC_ESTAT_APP_ID=<existing application ID> node --import tsx .claude/scripts/themes/verify-theme-expansion.mjs --artifacts /tmp/stats47-theme-expansion-api',
    series: [], responses: [], failures: [], registryComparisons: [],
  };
  async function request(endpoint, parameters, artifactName) {
    const url = new URL(`https://api.e-stat.go.jp/rest/3.0/app/json/${endpoint}`);
    for (const [key, value] of Object.entries({ appId, lang: 'J', ...parameters })) url.searchParams.set(key, String(value));
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = await response.text();
        const data = JSON.parse(raw);
        const root = data[endpoint === 'getMetaInfo' ? 'GET_META_INFO' : 'GET_STATS_DATA'];
        if (!root || Number(root.RESULT?.STATUS) !== 0) throw new Error(`API status ${root?.RESULT?.STATUS ?? 'missing'}`);
        fs.writeFileSync(path.join(artifacts, artifactName), raw);
        report.responses.push({ endpoint, parameters, sha256: sha256(raw), bytes: Buffer.byteLength(raw), artifactName });
        return root;
      } catch (error) {
        lastError = error;
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    // Do not serialize request URLs, which contain the application ID.
    throw new Error(`${endpoint} ${parameters.statsDataId}: ${lastError?.message?.startsWith('API status') || lastError?.message?.startsWith('HTTP') ? lastError.message : 'request failed'}`);
  }
  for (const letter of [...new Set(requestedCodes.map((code) => code[0]))]) {
    const statsDataId = `00000101${String(letter.charCodeAt(0) - 64).padStart(2, '0')}`;
    const codes = requestedCodes.filter((code) => code[0] === letter);
    try {
      const meta = await request('getMetaInfo', { statsDataId }, `${statsDataId}-meta.json`);
      const axes = array(meta.METADATA_INF.CLASS_INF.CLASS_OBJ);
      const indicatorAxis = axes.find((axis) => axis['@id'] === 'cat01');
      const classes = array(indicatorAxis?.CLASS);
      const known = codes.filter((code) => classes.some((item) => item['@code'] === code));
      for (const code of codes.filter((code) => !known.includes(code))) report.series.push({ code, statsDataId, status: 'not-in-current-metadata' });
      const rows = [];
      let startPosition = 1;
      const visited = new Set();
      while (known.length) {
        if (visited.has(startPosition)) throw new Error('Repeated pagination cursor');
        visited.add(startPosition);
        const result = await request('getStatsData', { statsDataId, cdCat01: known.join(','), metaGetFlg: 'N', limit: 100000, startPosition }, `${statsDataId}-data-${startPosition}.json`);
        const batch = array(result.STATISTICAL_DATA?.DATA_INF?.VALUE);
        if (batch.some((row) => !known.includes(row['@cat01']))) throw new Error('API returned an unrequested indicator');
        rows.push(...batch);
        const next = result.STATISTICAL_DATA?.RESULT_INF?.NEXT_KEY;
        if (next == null) break;
        startPosition = Number(next);
        if (!Number.isInteger(startPosition) || startPosition < 1) throw new Error('Invalid pagination cursor');
      }
      for (const code of known) {
        const definition = classes.find((item) => item['@code'] === code);
        const summary = summarizeSeries(rows.filter((row) => row['@cat01'] === code));
        const matches = definitions.filter((metric) => metric.source?.kind === 'estat' && metric.source.statsDataId === statsDataId && metric.source.cdCat01 === code);
        report.series.push({ code, statsDataId, status: summary.prefectureRows && !summary.duplicateAreaYears.length ? 'verified' : 'unusable', name: definition['@name'], metadataUnit: definition['@unit'] ?? null, description: definition['@description'] ?? null, sourceUrl: `https://www.e-stat.go.jp/dbview?sid=${statsDataId}`, registeredMetrics: matches.map((metric) => ({ key: metric.key, isActive: metric.isActive === true, unit: metric.unit, years: metric.years, sourceValueScale: metric.source.valueScale ?? 1 })), ...summary });
      }
      console.log(JSON.stringify({ statsDataId, requested: codes.length, returned: known.length, rows: rows.length }));
    } catch (error) {
      report.failures.push({ statsDataId, error: error.message });
      for (const code of codes.filter((code) => !report.series.some((series) => series.code === code))) report.series.push({ code, statsDataId, status: 'request-failed' });
      console.log(JSON.stringify({ statsDataId, failed: true }));
    }
    report.series.sort((a, b) => a.code.localeCompare(b.code));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  }
  // Existing ratio metric has a different SSDS code. Compare observations before reusing it.
  try {
    const metricKey = 'waste-recycling-rate';
    const { statsDataId, cdCat01 } = METRICS_REGISTRY[metricKey].source;
    const year = '2023';
    const result = await request('getStatsData', { statsDataId, cdCat01, metaGetFlg: 'N', limit: 100000 }, `${statsDataId}-recycling.json`);
    if (result.STATISTICAL_DATA?.RESULT_INF?.NEXT_KEY != null) throw new Error('Unexpected pagination in registry comparison');
    const rightRows = array(result.STATISTICAL_DATA?.DATA_INF?.VALUE).filter((row) => row['@time']?.slice(0, 4) === year);
    const leftRows = report.responses.filter((row) => row.endpoint === 'getStatsData' && row.parameters.statsDataId === '0000010108').flatMap((row) => array(JSON.parse(fs.readFileSync(path.join(artifacts, row.artifactName), 'utf8')).GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE)).filter((row) => row['@cat01'] === 'H5614' && row['@time']?.slice(0, 4) === year);
    const mismatches = PREFECTURES.filter((area) => {
      const left = leftRows.filter((row) => row['@area'] === area);
      const right = rightRows.filter((row) => row['@area'] === area && row['@cat01'] === cdCat01);
      return left.length !== 1 || right.length !== 1 || numericValue(left[0]?.$) === null || numericValue(left[0].$) !== numericValue(right[0]?.$) || left[0]['@unit'] !== right[0]['@unit'];
    });
    report.registryComparisons.push({ metricKey, indicatorCode: 'H5614', statsDataId, cdCat01, year, matchedPrefectures: 47 - mismatches.length, mismatches, scope: 'Value and unit equivalence for 2023 only; other years are not assumed equivalent.' });
    if (mismatches.length) report.failures.push({ statsDataId, error: 'Recycling metric equivalence failed' });
  } catch (error) {
    report.failures.push({ statsDataId: '0000010208', error: error.message });
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ requested: requestedCodes.length, verified: report.series.filter((series) => series.status === 'verified').length, failures: report.failures, registryComparisons: report.registryComparisons }));
  process.exitCode = report.failures.length ? 1 : 0;
}
