import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { PREFECTURES, validateStagedComparison } from './theme-expansion-core.mjs';

// Local preparation only: canonical builders produce the release files; no upload capability.
const require = createRequire(import.meta.url);
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const { buildPartitions } = require('../../../packages/ranking/src/scripts/generate-ranking-values.ts');
const { buildRankingItemFromMetric } = require('../../../packages/ranking/src/builders/build-ranking-item-from-metric.ts');
const { deriveFeaturedTop } = require('../../../packages/ranking/src/exporters/home-featured.ts');
const { RankingValuesKeySnapshotSchema } = require('../../../packages/ranking/src/repositories/schemas/ranking-values.schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const { values: options } = parseArgs({ options: {
  'api-artifact-dir': { type: 'string' },
  'stage-dir': { type: 'string', default: '.local/r2' },
  out: { type: 'string', default: '.local/verification/themes/first-batch/release-manifest.json' },
} });
if (!options['api-artifact-dir']) throw new Error('--api-artifact-dir from theme:expansion:verify is required');
const stage = resolve(root, options['stage-dir']);
const planPath = '.claude/skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json';
const evidencePath = '.claude/state/estat/theme-expansion-verification.json';
const plan = JSON.parse(await readFile(resolve(root, planPath), 'utf8'));
const evidence = JSON.parse(await readFile(resolve(root, evidencePath), 'utf8'));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const observedAt = new Date().toISOString();
const manifest = { schemaVersion: 1, generatedAt: observedAt, status: 'staged-unpublished', plan: planPath, evidence: evidencePath, themes: plan.firstBatch.map((row) => row.themeKey), metrics: [], files: [] };
const outputs = new Map();
const sourceRows = new Map();
const artifacts = evidence.requests ?? evidence.responses;
if (!Array.isArray(artifacts)) throw new Error('Verification report has no response manifest');
for (const response of artifacts.filter((row) => row.endpoint === 'getStatsData')) {
  const bytes = await readFile(resolve(options['api-artifact-dir'], response.artifactName));
  if (sha(bytes) !== response.sha256) throw new Error(`Source hash mismatch: ${response.artifactName}`);
  const rows = JSON.parse(bytes).GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE;
  for (const row of rows) {
    const key = `${response.parameters.statsDataId}:${row['@cat01']}`;
    const existing = sourceRows.get(key) ?? [];
    existing.push(row); sourceRows.set(key, existing);
  }
}
async function publicJson(key) {
  const response = await fetch(`https://storage.stats47.jp/${key}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Public ${key}: HTTP ${response.status}`);
  return response.json();
}
for (const batch of plan.firstBatch) {
  for (const metric of batch.metrics) {
    const key = metric.metricKey;
    const config = METRICS_REGISTRY[key];
    if (!config?.isActive) throw new Error(`Unregistered metric: ${key}`);
    const statsKey = `app/stats/${key}/values.json`;
    // Newly registered metrics are ingested by page-data-batch, which applies the shared shape gate.
    // Existing observations come from public SSOT and keep all historical years.
    const input = metric.proposedMetricKey
      ? JSON.parse(await readFile(resolve(stage, statsKey), 'utf8'))
      : await publicJson(statsKey);
    const payload = parseStatsValuesPayload(input);
    if (payload.metricKey !== key || payload.entityKind !== 'prefecture') throw new Error(`Wrong payload identity: ${key}`);
    const rows = payload.rows.filter((row) => row.yearCode === metric.comparisonYear);
    if (rows.length !== 47 || new Set(rows.map((row) => row.areaCode)).size !== 47 || !PREFECTURES.every((code) => rows.some((row) => row.areaCode === code && Number.isFinite(row.value)))) throw new Error(`Incomplete comparison: ${key}`);
    const source = evidence.series.find((row) => row.code === metric.indicatorCode);
    const raw = sourceRows.get(`${source.statsDataId}:${metric.indicatorCode}`)?.filter((row) => row['@time'].slice(0, 4) === metric.comparisonYear && PREFECTURES.includes(row['@area']));
    if (raw?.length !== 47) throw new Error(`Missing verified source: ${key}`);
    const mismatches = validateStagedComparison(rows, raw, config.unit);
    if (config.unit !== metric.unit || mismatches.length) throw new Error(`${key}: ${mismatches.join('; ') || 'Planned unit mismatch'}`);
    const partitions = buildPartitions(key, payload.rows, config.years);
    const comparison = partitions.find((partition) => partition.yearCode === metric.comparisonYear);
    if (comparison?.values.length !== 47) throw new Error(`Incomplete ranking: ${key}`);
    const ranking = RankingValuesKeySnapshotSchema.parse({ generatedAt: observedAt, rankingKey: key, areaType: 'prefecture', partitions });
    const item = buildRankingItemFromMetric(config, { now: observedAt, registry: METRICS_REGISTRY, values: { yearCodes: partitions.map((partition) => partition.yearCode), latestTop: deriveFeaturedTop(partitions[0].values) } });
    outputs.set(statsKey, payload);
    outputs.set(`app/ranking/${key}/values.json`, ranking);
    outputs.set(`app/ranking/${key}/item.json`, { generatedAt: observedAt, item });
    manifest.metrics.push({ themeKey: batch.themeKey, metricKey: key, indicatorCode: metric.indicatorCode, comparisonYear: metric.comparisonYear, comparisonPrefectures: 47, sourceMatchedPrefectures: 47, unit: config.unit, preservedYears: [...new Set(payload.rows.map((row) => row.yearCode))].sort(), sourceSha256: sha(JSON.stringify(raw)) });
  }
  const componentKey = `app/page-components/theme/${batch.themeKey}.json`;
  outputs.set(componentKey, JSON.parse(await readFile(resolve(root, `apps/web/scripts/data/page-components/theme/${batch.themeKey}.json`), 'utf8')));
}
const inventoryKey = 'app/ranking-items/all.json';
const inventory = await publicJson(inventoryKey);
if (!Array.isArray(inventory.items) || inventory.items.length < 2000 || new Set(inventory.items.map((item) => item.rankingKey)).size !== inventory.items.length) throw new Error('Invalid public ranking inventory');
const byKey = new Map(inventory.items.map((item) => [item.rankingKey, item]));
for (const metric of manifest.metrics) byKey.set(metric.metricKey, outputs.get(`app/ranking/${metric.metricKey}/item.json`).item);
outputs.set(inventoryKey, { ...inventory, generatedAt: observedAt, count: byKey.size, items: [...byKey.values()] });
// Validate everything before replacing any staged file. The manifest is written last.
for (const [key, value] of outputs) {
  const bytes = JSON.stringify(value);
  const path = resolve(stage, key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
  manifest.files.push({ key, bytes: Buffer.byteLength(bytes), sha256: sha(bytes) });
}
const out = resolve(root, options.out);
await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ themes: manifest.themes.length, metrics: manifest.metrics.length, matchedPrefectures: manifest.metrics.length * 47, files: manifest.files.length, manifest: out, uploaded: false }));
