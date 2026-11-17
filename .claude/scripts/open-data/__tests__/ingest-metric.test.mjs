import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { datasetPath } from '../../../../config/datasets.mjs';
import { PREFECTURES } from '../../lib/prefectures.cjs';
import { statsR2Key } from '../../lib/r2-keys.mjs';
import { verifyIngestReport } from '../../themes/verify-external-ingest.mjs';
import { buildMetricPayload, ingestMetrics, selectCandidate, METRIC_KEYS } from '../ingest-metric.mjs';
import { ROOT, loadCatalog, sha256, writeJson } from '../lib/contracts.mjs';
import { archiveRecipe, loadSnapshot } from '../lib/archive.mjs';
import { normalizeRecipe } from '../normalize-source.mjs';
import { temp, httpClient } from './fixtures.mjs';

const generatedAt = '2026-11-15T00:00:00.000Z';
const localKey = (root, key) => path.join(root, '.local/r2', key);
function fixture() {
  const dataset = { id: 'fixture-source', license: { commercialUse: 'allowed' } };
  const table = { datasetId: dataset.id, version: '2025', table: 'observations', rows: PREFECTURES.map((p, i) => ({
    areaCode: p.prefCode, areaLevel: 'prefecture', time: '2025', dims: {}, value: 2 * (i + 1), unit: '人',
  })) };
  const denominatorBytes = Buffer.from(JSON.stringify({ metricKey: 'total-population', entityKind: 'prefecture', rows: PREFECTURES.map((p) => ({ areaCode: p.prefCode, yearCode: '2025', value: 200000, unit: '人' })) }));
  const candidate = { datasetId: dataset.id, table: table.table, metricKey: 'fixture-metric', status: 'planned', channel: 'prefecture-ranking',
    slice: { version: '2025', areaLevel: 'prefecture', dims: {}, time: { kind: 'point', value: '2025' }, dimensionAggregation: 'none', timeAggregation: 'none' },
    unit: '人/10万人', aggregation: { type: 'per-100k', denominatorTime: '2025' }, denominator: 'total-population',
    verification: { tableSha256: '', rowCount: 47, areaCount: 47, min: 1, max: 47, denominatorTime: '2025', denominatorSha256: sha256(denominatorBytes) } };
  const config = { key: candidate.metricKey, title: 'テスト', unit: '人', entities: ['prefecture'], years: { from: 2025, to: 2025 }, yearFormat: 'calendar',
    display: { conversionFactor: 1, decimalPlaces: 2 }, source: { kind: 'external', fetcherKey: 'manual', config: { provenance: { openData: {
      datasetId: dataset.id, version: '2025', table: table.table, candidate: { metricKey: candidate.metricKey, channel: candidate.channel },
    } } } } };
  return { dataset, table, candidate, config, denominatorBytes, generatedAt };
}
function withBytes(f) {
  const tableBytes = Buffer.from(JSON.stringify(f.table));
  f.candidate.verification.tableSha256 = sha256(tableBytes);
  return { ...f, tableBytes };
}

test('population denominator, 47 values, unit/year and descending competition ranks', () => {
  const payload = buildMetricPayload(withBytes(fixture()));
  assert.equal(payload.rows.length, 47);
  payload.rows.forEach((r, i) => {
    assert.ok(Math.abs(r.value - (i + 1)) < 1e-12);
    assert.deepEqual([r.rank, r.unit, r.yearName], [47 - i, '人', '2025年']);
  });
});

test('identity, answer sums and ties use the unrounded values', () => {
  const f = fixture();
  f.candidate.aggregation = { type: 'identity' }; f.candidate.unit = f.config.unit = '％';
  f.candidate.slice.dims = { answer: ['1', '2'] }; f.candidate.slice.dimensionAggregation = 'sum';
  f.table.rows = f.table.rows.flatMap((r, i) => ['1', '2'].map((answer) => ({ ...r, unit: '％', dims: { answer }, value: Math.max(2, i + 1) / 2 })));
  Object.assign(f.candidate.verification, { min: 2, max: 47, rowCount: 94 });
  const payload = buildMetricPayload(withBytes(f));
  assert.deepEqual(payload.rows.slice(0, 2).map((r) => [r.value, r.rank]), [[2, 46], [2, 46]]);
  assert.equal(payload.rows[46].rank, 1);
});

for (const aggregation of ['sum', 'max']) test(`daily ${aggregation} uses every date in the declared range`, () => {
  const f = fixture();
  Object.assign(f.candidate.slice, { time: { kind: 'range', start: '2025-05-01', end: '2025-05-02' }, timeAggregation: aggregation });
  f.table.rows = f.table.rows.flatMap((r) => [1, 2].map((day) => ({ ...r, time: `2025/5/${day}`, value: r.value * day })));
  Object.assign(f.candidate.verification, { rowCount: 94, min: aggregation === 'sum' ? 3 : 2, max: aggregation === 'sum' ? 141 : 94 });
  const payload = buildMetricPayload(withBytes(f));
  assert.equal(payload.rows[0].value, f.candidate.verification.min);
  assert.equal(payload.rows[46].value, f.candidate.verification.max);
  f.table.rows.pop();
  assert.throws(() => buildMetricPayload(withBytes(f)), /欠測/);
});

test('candidate binding is exact and distinguishes the theme candidate with the same key', () => {
  const f = fixture();
  const expansion = { candidates: [f.candidate, { ...f.candidate, channel: 'theme' }] };
  assert.equal(selectCandidate(f.config, expansion), f.candidate);
  f.config.source.config.provenance.openData.version = '2024';
  assert.throws(() => selectCandidate(f.config, expansion));
});

async function ingestFixture(t) {
  const root = temp(t);
  const f = fixture();
  const dataset = structuredClone(loadCatalog().datasets.find((d) => d.license.commercialUse === 'allowed' && !d.id.startsWith('nier-')));
  f.dataset = dataset; f.candidate.datasetId = dataset.id;
  f.config.source.config.provenance.openData.datasetId = dataset.id;
  const body = Buffer.from('pref,value\n' + PREFECTURES.map((p, i) => `${p.prefCode},${2 * (i + 1)}\n`).join(''));
  const recipe = { datasetId: dataset.id, version: '2025', fetch: { type: 'http-file', urls: ['https://example.test/source.csv'] },
    normalize: { tables: [{ table: 'observations', filePattern: '\\.csv$', areas: [{ level: 'prefecture', column: 'pref' }], time: '$version', dims: {}, aggregation: 'sum', valueColumn: 'value', unit: '人' }] } };
  writeJson(path.join(root, datasetPath('open-data.datasets')), { datasets: [dataset] });
  writeJson(path.join(root, datasetPath('open-data.fetch-recipes')), { recipes: [recipe] });
  await archiveRecipe({ root, recipe, dataset, apply: true, now: () => generatedAt, client: httpClient(new Map([['https://example.test/source.csv', body]])) });
  const entry = loadSnapshot(root, dataset.id).versions[0];
  const objects = new Map([entry.manifestKey, ...entry.files.map((file) => file.key)].map((key) => [key, { body: fs.readFileSync(localKey(root, key)) }]));
  const normalized = await normalizeRecipe(recipe, root);
  f.candidate.verification.tableSha256 = normalized.outputs[0].sha256;
  writeJson(path.join(root, datasetPath('open-data.expansion')), { schemaVersion: 1, candidates: [f.candidate] });
  const denominatorKey = statsR2Key('total-population', 'prefecture');
  fs.mkdirSync(path.dirname(localKey(root, denominatorKey)), { recursive: true });
  fs.writeFileSync(localKey(root, denominatorKey), f.denominatorBytes);
  return { ...f, root, objects, entry, denominatorKey, out: path.join(root, 'report.json'),
    key: statsR2Key(f.config.key, 'prefecture') };
}

test('local originals need no credentials or network; report passes the existing publisher verifier', async (t) => {
  const f = await ingestFixture(t);
  const report = await ingestMetrics({ ...f, configs: [f.config], localSource: true, writeLocal: true,
    store: { get: () => assert.fail('network') }, readPublic: () => assert.fail('network') });
  assert.deepEqual(verifyIngestReport(report, (key) => fs.readFileSync(localKey(f.root, key))), [f.key]);
  assert.equal(report.series[0].rows[46].value, 47);
});

test('CI restores exact private keys and reads the public denominator without PUT', async (t) => {
  const f = await ingestFixture(t); const reads = [];
  fs.rmSync(path.join(f.root, '.local/r2'), { recursive: true });
  const report = await ingestMetrics({ ...f, configs: [f.config], writeLocal: true,
    store: { get: async (key) => { reads.push(key); return f.objects.get(key); }, put: () => assert.fail('PUT') },
    readPublic: async (key) => { assert.equal(key, f.denominatorKey); return f.denominatorBytes; } });
  assert.deepEqual(reads.sort(), [...f.objects.keys()].sort());
  assert.deepEqual(verifyIngestReport(report, (key) => fs.readFileSync(localKey(f.root, key))), [f.key]);
});

test('a later metric verification failure creates no observations or report for the batch', async (t) => {
  const f = await ingestFixture(t);
  const second = structuredClone(f.config); second.key = 'second-metric';
  second.source.config.provenance.openData.candidate.metricKey = second.key;
  const candidate = structuredClone(f.candidate); candidate.metricKey = second.key; candidate.verification.max = 999;
  writeJson(path.join(f.root, datasetPath('open-data.expansion')), { schemaVersion: 1, candidates: [f.candidate, candidate] });
  await assert.rejects(ingestMetrics({ ...f, configs: [f.config, second], localSource: true, writeLocal: true }), /verification max/);
  for (const key of [f.key, statsR2Key(second.key, 'prefecture')]) assert.equal(fs.existsSync(localKey(f.root, key)), false);
  assert.equal(fs.existsSync(f.out), false);
});

for (const mutation of ['year', 'unit', 'null', 'duplicate']) test(`invalid denominator ${mutation} is rejected even with matching SHA`, () => {
  const f = fixture(); const denominator = JSON.parse(f.denominatorBytes);
  if (mutation === 'year') denominator.rows.forEach((r) => { r.yearCode = '2024'; });
  if (mutation === 'unit') denominator.rows[0].unit = '千人';
  if (mutation === 'null') denominator.rows[0].value = null;
  if (mutation === 'duplicate') denominator.rows.push({ ...denominator.rows[0] });
  f.denominatorBytes = Buffer.from(JSON.stringify(denominator));
  f.candidate.verification.denominatorSha256 = sha256(f.denominatorBytes);
  assert.throws(() => buildMetricPayload(withBytes(f)), /分母/);
});

for (const mutation of ['min', 'max', 'rowCount', 'areaCount', 'tableSha256', 'denominatorSha256', 'denominatorTime', 'raw', 'license']) {
  test(`${mutation} mismatch leaves existing observations and report unchanged`, async (t) => {
    const f = await ingestFixture(t);
    if (mutation === 'license') {
      f.dataset.license.commercialUse = 'unknown';
      writeJson(path.join(f.root, datasetPath('open-data.datasets')), { datasets: [f.dataset] });
    } else if (mutation === 'raw') fs.writeFileSync(localKey(f.root, f.entry.files[0].key), 'corrupt');
    else {
      f.candidate.verification[mutation] = mutation.endsWith('Sha256') ? '0'.repeat(64) : mutation === 'denominatorTime' ? '2024' : f.candidate.verification[mutation] + 1;
      writeJson(path.join(f.root, datasetPath('open-data.expansion')), { schemaVersion: 1, candidates: [f.candidate] });
    }
    fs.mkdirSync(path.dirname(localKey(f.root, f.key)), { recursive: true });
    fs.writeFileSync(localKey(f.root, f.key), 'previous observations'); fs.writeFileSync(f.out, 'previous report');
    await assert.rejects(ingestMetrics({ ...f, configs: [f.config], localSource: true, writeLocal: true }));
    assert.equal(fs.readFileSync(localKey(f.root, f.key), 'utf8'), 'previous observations');
    assert.equal(fs.readFileSync(f.out, 'utf8'), 'previous report');
  });
}

for (const commercialUse of ['prohibited', undefined]) test(`commercialUse=${commercialUse} fails closed`, () => {
  const f = withBytes(fixture()); f.dataset.license.commercialUse = commercialUse;
  assert.throws(() => buildMetricPayload(f), /commercialUse must be allowed/);
});

test('workflow registers the eighteen-metric batch with the existing explicit-key publisher', () => {
  const workflow = YAML.parse(fs.readFileSync(path.join(ROOT, '.github/workflows/external-metric-ingest.yml'), 'utf8'));
  assert.ok(workflow.on.workflow_dispatch.inputs.ingest.options.includes('open-data-rankings'));
  assert.match(workflow.jobs.ingest.steps.find((s) => s.run?.includes('case "$INGEST"')).run, /open-data-rankings\) script=\.claude\/scripts\/open-data\/ingest-metric\.mjs;/);
  assert.equal(METRIC_KEYS.length, 18);
});
