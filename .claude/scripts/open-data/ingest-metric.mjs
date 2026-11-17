#!/usr/bin/env node
// Offline: --metric <key> --local-source --write-local --out /tmp/report.json
// Without --metric, all registered open-data ranking metrics are built (CI: ingest=open-data-rankings); this script only reads R2.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { require as requireTs } from 'tsx/cjs/api';
import { datasetPath } from '../../../config/datasets.mjs';
import { PREFECTURES } from '../lib/prefectures.cjs';
import { statsR2Key, R2_PUBLIC_ORIGIN } from '../lib/r2-keys.mjs';
import { R2_PRIVATE_BUCKET } from '../lib/site-config.cjs';
import { ROOT, assertPublishable, assertSha, loadCatalog, readJson, sha256, writeJson } from './lib/contracts.mjs';
import { loadSnapshot, localKey, snapshotPath, verifyEntry } from './lib/archive.mjs';
import { restoreEntry } from './lib/restore.mjs';
import { normalizeRecipe } from './normalize-source.mjs';

const { evaluateExpansionCandidate, selectExpansionDenominator } = requireTs('../../../packages/data-configs/src/open-data-catalog/expansion.ts', import.meta.url);
const { buildRecipe } = requireTs('../../../packages/data-configs/src/recipe.ts', import.meta.url);
const { parseStatsValuesPayload } = requireTs('../../../packages/stats-r2/src/schemas.ts', import.meta.url);

export const METRIC_KEYS = [
  'national-assessment-junior-high-mathematics-correct-rate',
  'national-assessment-elementary-mathematics-correct-rate',
  'heatstroke-emergency-transports-per-100k',
  'national-assessment-junior-high-self-esteem-rate',
  'traffic-accidents-party-a-age-75-plus-per-100k',
  'national-assessment-elementary-japanese-correct-rate',
  'national-assessment-junior-high-japanese-correct-rate',
  'national-assessment-elementary-self-esteem-rate',
  'national-assessment-elementary-future-goal-rate',
  'national-assessment-junior-high-future-goal-rate',
  'national-assessment-elementary-school-enjoyment-rate',
  'national-assessment-junior-high-school-enjoyment-rate',
  'national-assessment-elementary-friendship-satisfaction-rate',
  'national-assessment-junior-high-friendship-satisfaction-rate',
  'road-traffic-congestion',
  'road-heavy-vehicle-share',
  'road-peak-travel-speed',
  'snow-weather-traffic-accidents-per-100k',
];

/** 一括の取り込みの対象: 登録済みの指標のうち、展開の台帳に県ランキングの候補が残っているもの。 */
export function pendingMetricKeys(expansion) {
  return METRIC_KEYS.filter((key) => expansion.candidates.some((c) => c.metricKey === key && c.channel === 'prefecture-ranking'));
}

export function selectCandidate(config, expansion) {
  assert.equal(config?.source.kind, 'external');
  assert.match(config.key, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  const ref = config.source.config.provenance?.openData;
  assert.equal(ref?.candidate?.metricKey, config.key, 'candidate metricKey mismatch');
  assert.equal(ref?.candidate?.channel, 'prefecture-ranking');
  const candidates = expansion.candidates.filter((c) => c.metricKey === ref.candidate.metricKey && c.channel === ref.candidate.channel);
  assert.equal(candidates.length, 1, 'Exactly one expansion candidate required');
  const candidate = candidates[0];
  assert.equal(candidate.status, 'planned');
  assert.equal(candidate.datasetId, ref.datasetId);
  assert.equal(candidate.table, ref.table);
  assert.equal(candidate.slice.version, ref.version);
  assert.equal(candidate.slice.areaLevel, 'prefecture');
  return candidate;
}

/** The shared evaluator validates the slice, completeness, dimensions and denominator first. */
export function buildMetricPayload({ config, candidate, dataset, tableBytes, denominatorBytes, generatedAt }) {
  assertPublishable(dataset);
  assert.equal(dataset.id, candidate.datasetId);
  const saved = candidate.verification;
  assert.ok(saved, 'verification required');
  assertSha(tableBytes, saved.tableSha256);
  const table = JSON.parse(String(tableBytes));
  let denominator;
  if (candidate.aggregation.type !== 'identity') {
    assert.equal(saved.denominatorTime, candidate.aggregation.denominatorTime);
    assert.ok(denominatorBytes, 'denominator required');
    assertSha(denominatorBytes, saved.denominatorSha256);
    denominator = selectExpansionDenominator(candidate, JSON.parse(String(denominatorBytes)));
  }
  const result = evaluateExpansionCandidate(candidate, table, denominator);
  for (const field of ['rowCount', 'areaCount']) assert.equal(result[field], saved[field], `verification ${field} mismatch`);
  for (const field of ['min', 'max']) assert.ok(Math.abs(result[field] - saved[field]) <= 1e-9, `verification ${field} mismatch`);
  assert.equal(result.areaCount, 47);
  const { slice } = candidate;
  const year = (slice.time.kind === 'point' ? slice.time.value : slice.time.end).slice(0, 4);
  assert.match(year, /^\d{4}$/);
  assert.deepEqual(config.years, { from: Number(year), to: Number(year) });
  assert.deepEqual(config.entities, ['prefecture']);
  assert.equal(config.display.conversionFactor, 1);
  assert.equal(config.unit, candidate.aggregation.type === 'per-100k' ? candidate.unit.replace('/10万人', '') : candidate.unit);
  assert.equal(config.yearFormat, candidate.datasetId.startsWith('nier-') ? 'fiscal' : 'calendar');
  const rows = PREFECTURES.map(({ prefCode: areaCode, prefName: areaName }) => {
    const times = new Map();
    for (const row of table.rows) {
      const date = slice.time.kind === 'range' ? row.time.replaceAll('/', '-').split('-').map((v, i) => i ? v.padStart(2, '0') : v).join('-') : row.time;
      if (row.areaCode !== areaCode || row.areaLevel !== 'prefecture'
        || !Object.entries(slice.dims).every(([key, values]) => values.includes(row.dims[key]))
        || !(slice.time.kind === 'point' ? date === slice.time.value : date >= slice.time.start && date <= slice.time.end)) continue;
      times.set(date, (times.get(date) ?? 0) + row.value);
    }
    let value = slice.timeAggregation === 'max' ? Math.max(...times.values()) : [...times.values()].reduce((sum, v) => sum + v, 0);
    if (candidate.aggregation.type !== 'identity') value = value / denominator.get(areaCode) * (candidate.aggregation.type === 'per-100k' ? 100000 : candidate.aggregation.scale ?? 1);
    assert.ok(Number.isFinite(value));
    return { areaCode, areaName, yearCode: year, yearName: `${year}${config.yearFormat === 'fiscal' ? '年度' : '年'}`, value, unit: config.unit };
  });
  for (const [field, value] of [['min', Math.min(...rows.map((r) => r.value))], ['max', Math.max(...rows.map((r) => r.value))]]) {
    assert.ok(Math.abs(value - result[field]) <= 1e-9, `observation ${field} differs from evaluator`);
  }
  // Competition ranking: ties share a rank; the following rank includes all preceding rows.
  const sorted = [...rows].sort((a, b) => b.value - a.value || a.areaCode.localeCompare(b.areaCode));
  const ranks = new Map();
  sorted.forEach((row, i) => { if (!ranks.has(row.value)) ranks.set(row.value, i + 1); });
  return parseStatsValuesPayload({
    metricKey: config.key, entityKind: 'prefecture',
    rows: rows.map((row) => ({ ...row, rank: ranks.get(row.value) })),
    meta: { rowCount: rows.length, areaCount: rows.length, yearRange: [year, year], generatedAt,
      recipe: buildRecipe(config) },
  });
}

/** Use normalize-ci's SHA-checked restore, in disposable storage, for both local and private R2 originals. */
export async function prepareTable({ root, scratch, candidate, recipe, localSource, store }) {
  const entry = loadSnapshot(root, candidate.datasetId).versions.find((e) => e.version === candidate.slice.version);
  assert.ok(entry, 'Source snapshot version missing');
  if (localSource) await verifyEntry(root, entry);
  const manifestBody = localSource ? fs.readFileSync(localKey(root, entry.manifestKey)) : (await store.get(entry.manifestKey))?.body;
  assert.ok(manifestBody, 'Source manifest missing');
  await restoreEntry({ entry, root: scratch, manifestBody, download: async (file, destination) => {
    if (localSource) fs.copyFileSync(localKey(root, file.key), destination);
    else {
      const object = await store.get(file.key);
      assert.ok(object, `Source file missing: ${file.key}`);
      fs.writeFileSync(destination, object.body);
    }
  } });
  writeJson(snapshotPath(scratch, candidate.datasetId), { datasetId: candidate.datasetId, versions: [entry] });
  await normalizeRecipe(recipe, scratch);
  return fs.readFileSync(localKey(scratch, `open-data/normalized/${candidate.datasetId}/${entry.version}/${candidate.table}.json`));
}

async function privateReadStore() {
  // Explicit bucket avoids changing the public publisher's process environment.
  const { createS3ImageObjectStore } = requireTs('../../../packages/r2-storage/src/image-pipeline.ts', import.meta.url);
  const { createR2S3Client } = await import('../../../packages/r2-storage/src/lib/clients/r2-s3-client.mjs');
  const store = createS3ImageObjectStore(createR2S3Client(), R2_PRIVATE_BUCKET);
  return { get: (key) => store.get(key) };
}

export async function ingestMetrics({ configs, root = ROOT, localSource = false, writeLocal = false, out, store,
  readPublic = async (key) => {
    const response = await fetch(`${process.env.R2_PUBLIC_FETCH_URL ?? R2_PUBLIC_ORIGIN}/${key}`, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Public denominator HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }, now = () => new Date().toISOString() }) {
  const catalog = loadCatalog(root);
  const expansion = readJson(path.join(root, datasetPath('open-data.expansion')));
  const entries = configs.map((config) => {
    const candidate = selectCandidate(config, expansion);
    const dataset = catalog.datasets.find((d) => d.id === candidate.datasetId);
    assertPublishable(dataset);
    const recipe = catalog.recipes.find((r) => r.datasetId === dataset.id);
    assert.ok(recipe?.normalize?.tables.some((t) => t.table === candidate.table), 'Normalization recipe missing');
    return { config, candidate, dataset, recipe };
  });
  assert.ok(entries.length > 0);
  assert.equal(new Set(configs.map((c) => c.key)).size, configs.length);
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'open-data-ingest-'));
  const generatedAt = now();
  try {
    const privateStore = localSource ? undefined : store ?? await privateReadStore();
    const tables = new Map();
    const denominators = new Map();
    const files = [];
    const series = [];
    for (const entry of entries) {
      const { config, candidate } = entry;
      const tableKey = `${candidate.datasetId}/${candidate.slice.version}/${candidate.table}`;
      if (!tables.has(tableKey)) tables.set(tableKey, await prepareTable({ ...entry, root, scratch, localSource, store: privateStore }));
      let denominatorBytes;
      if (candidate.aggregation.type !== 'identity') {
        const key = statsR2Key(candidate.denominator, 'prefecture');
        if (!denominators.has(key)) denominators.set(key, localSource ? fs.readFileSync(path.join(root, '.local/r2', key)) : await readPublic(key));
        denominatorBytes = denominators.get(key);
      }
      const payload = buildMetricPayload({ ...entry, tableBytes: tables.get(tableKey), denominatorBytes, generatedAt });
      const content = `${JSON.stringify(payload, null, 2)}\n`;
      files.push({ key: statsR2Key(config.key, 'prefecture'), sha256: sha256(content), content });
      series.push({ metricKey: config.key, title: config.title, verification: candidate.verification, rows: payload.rows });
    }
    // Validate ALL metrics before touching any observation or report, including pre-existing output.
    if (writeLocal) for (const file of files) writeJson(path.join(root, '.local/r2', file.key), JSON.parse(file.content));
    const report = { status: 'PASS', generatedAt, localStaged: writeLocal, metrics: files.length,
      rows: series.reduce((n, s) => n + s.rows.length, 0), files: files.map(({ content, ...file }) => file), series };
    if (out) writeJson(path.resolve(root, out), report);
    return report;
  } finally { fs.rmSync(scratch, { recursive: true, force: true }); }
}

export async function main(args = process.argv.slice(2)) {
  const { values: options } = parseArgs({ args, options: {
    metric: { type: 'string' }, 'write-local': { type: 'boolean', default: false },
    'local-source': { type: 'boolean', default: false }, out: { type: 'string' },
  } });
  // 既定の一括は、展開の台帳に候補が残っている指標だけ。公開済みの指標は公開時に候補を台帳から外すので、一括に含めると最初の 1 本で止まる。
  const keys = options.metric ? [options.metric] : pendingMetricKeys(readJson(path.join(ROOT, datasetPath('open-data.expansion'))));
  assert.ok(keys.length && keys.every((key) => METRIC_KEYS.includes(key)), '--metric <registered key> required');
  const { METRICS_REGISTRY } = requireTs('../../../packages/data-configs/src/registry.ts', import.meta.url);
  const report = await ingestMetrics({ configs: keys.map((key) => METRICS_REGISTRY[key]),
    localSource: options['local-source'], writeLocal: options['write-local'], out: options.out });
  console.log(JSON.stringify({ status: report.status, metrics: report.metrics, rows: report.rows, localStaged: report.localStaged }));
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
