#!/usr/bin/env node
/** Recompute public CSV inputs before writing four series and their distribution. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const { PROPERTY_PRICE_DISTRIBUTION_SOURCE: source } = require('../../../packages/data-configs/src/theme-catalog/property-price-distribution-source.ts');
const { parsePropertyPriceDistributionSnapshot } = require('../../../apps/web/src/features/property-price-distribution/lib/property-price-distribution-snapshot.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const sha = v => createHash('sha256').update(v).digest('hex');
export async function main() {
  const { values: o } = parseArgs({ options: { 'write-local': { type: 'boolean', default: false }, 'source-dir': { type: 'string', default: resolve(root, '.local/verification/themes/property-market-source') }, out: { type: 'string', default: resolve(root, '.local/verification/themes/property-prices-source.json') } } });
  // The committed parser regenerates from 47 transaction ZIPs and official
  // CSV/GeoJSON, checking receipt hashes, filters and row conservation.
  execFileSync('python3', [resolve(root, '.claude/scripts/themes/property-prices/build-property-profile.py'), '--source-dir', o['source-dir']], { stdio: 'pipe' });
  const manifestBytes = await readFile(resolve(o['source-dir'], 'source-manifest.json'));
  assert.equal(sha(manifestBytes), source.sourceManifestSha256, 'original source manifest');
  const profileBytes = await readFile(resolve(o['source-dir'], 'property-prices.json'));
  const profile = parsePropertyPriceDistributionSnapshot(JSON.parse(profileBytes));
  const observations = JSON.parse(await readFile(resolve(o['source-dir'], 'metric-values.json'), 'utf8'));
  assert.equal(observations.length, 4);assert.equal(new Set(observations.map(r => r.metricKey)).size, 4);
  const registry = require('../../../packages/data-configs/src/registry.ts').METRICS_REGISTRY;
  const generatedAt = new Date().toISOString();
  const files = source.metrics.map(metric => {
    const config = registry[metric.key];assert.ok(config?.isActive);
    assert.equal(config.unit, metric.unit);assert.equal(config.display.conversionFactor, 1);
    assert.deepEqual(config.entities, ['prefecture']);assert.deepEqual(config.years, { from: 2025, to: 2025 });
    assert.equal(config.source.config.sourceManifestSha256, source.sourceManifestSha256);
    assert.equal(config.source.config.dataset, metric.dataset);assert.equal(config.source.config.statistic, metric.statistic);
    const rows = observations.find(r => r.metricKey === metric.key)?.rows;
    assert.equal(rows?.length, 47);assert.equal(new Set(rows.map(r => r.areaCode)).size, 47);
    for (const row of rows) {
      const area = profile.areas.find(a => a.areaCode === row.areaCode);assert.ok(area);
      assert.equal(row.areaName, area.areaName);assert.equal(row.value, area[metric.dataset][metric.statistic]);
      assert.equal(row.unit, metric.unit);assert.equal(row.yearCode, source.year);
    }
    const payload = parseStatsValuesPayload({ metricKey: metric.key, entityKind: 'prefecture', rows, meta: { generatedAt, rowCount: 47, areaCount: 47, yearRange: ['2025','2025'], recipe: buildRecipe(config) } });
    return { key: 'app/stats/' + metric.key + '/values.json', content: Buffer.from(JSON.stringify(payload)), rowCount: 47 };
  });
  const audit = JSON.parse(await readFile(resolve(o['source-dir'], 'aggregate-audit.json'), 'utf8'));
  assert.equal(audit.pass, true);
  files.push({ key: source.r2Key, content: profileBytes, rowCount: 96 });
  if (o['write-local']) for (const f of files) { const path = resolve(root, '.local/r2', f.key);await mkdir(dirname(path), { recursive: true });await writeFile(path, f.content); }
  const report = { generatedAt, status: o['write-local'] ? 'source-verified-staged' : 'source-verified', sourceManifestSha256: source.sourceManifestSha256, sourceManifest: JSON.parse(manifestBytes), checks: { ...audit, profileMetricMatches: 188 }, files: files.map(({ content, ...f }) => ({ ...f, sha256: sha(content) })) };
  await mkdir(dirname(resolve(o.out)), { recursive: true });await writeFile(o.out, JSON.stringify(report, null, 2) + '\n');console.log(JSON.stringify({ status: report.status, metrics: 4, matchedRows: 188, distributions: 96, output: o.out }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
