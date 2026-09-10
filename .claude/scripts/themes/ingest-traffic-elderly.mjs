#!/usr/bin/env node
/** Verify the existing series against official 2024 data and preserve its history. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { parseArgs } from 'node:util';
const root = process.cwd(),
  require = createRequire(resolve(root, 'package.json')),
  sha = (b) => createHash('sha256').update(b).digest('hex');
const key = 'traffic-accident-casualties-elderly-65plus';
const { values: o } = parseArgs({
  options: {
    'write-local': { type: 'boolean', default: false },
    'source-dir': {
      type: 'string',
      default: resolve(
        root,
        '.local/verification/themes/traffic-elderly-source'
      ),
    },
    out: {
      type: 'string',
      default: resolve(
        root,
        '.local/verification/themes/traffic-elderly-source.json'
      ),
    },
  },
});
const receipts = {};
const docs = {};
const sourceHashes = {
  source: '5e095734720fe5ccb32a94b141e54ac5806d35e6e608100c44c971a74c76609d',
  values: 'ab100723cfe7f4b8a9b3ea9cb4f4963d3d565a4db4907d6e527cad8370374ff0',
  definitions: '8a3c68f18fc7dec2bea26879744898accdf3a4e627d6389ce0339411f3366f4b',
};
for (const n of ['source', 'values', 'definitions']) {
  const receipt = JSON.parse(
    await readFile(resolve(o['source-dir'], n + '-receipt.json'), 'utf8')
  );
  const b = await readFile(
    resolve(o['source-dir'], n + (n === 'definitions' ? '.html' : '.json'))
  );
  assert.equal(receipt.sha256, sourceHashes[n], n + ' pinned receipt');
  assert.equal(sha(b), sourceHashes[n], n + ' raw SHA');
  receipts[n] = receipt;
  docs[n] = n === 'definitions' ? b.toString() : JSON.parse(b);
}
assert.ok(
  docs.definitions.includes('K310203') && docs.definitions.includes('暦年計'),
  'official definition'
);
const d = docs.source.GET_STATS_DATA;
assert.equal(d.RESULT.STATUS, 0);
const s = d.STATISTICAL_DATA;
assert.equal(s.TABLE_INF['@id'], '0000010111');
assert.deepEqual(s.RESULT_INF, {
  TOTAL_NUMBER: 48,
  FROM_NUMBER: 1,
  TO_NUMBER: 48,
});
const rows = s.DATA_INF.VALUE;
assert.equal(rows.length, 48);
assert.equal(new Set(rows.map((r) => r['@area'])).size, 48);
for (const r of rows) {
  assert.equal(r['@cat01'], 'K310203');
  assert.equal(r['@tab'], '00001');
  assert.equal(r['@time'], '2024100000');
  assert.equal(r['@unit'], '人');
  assert.match(r.$, /^\d+$/);
}
const prefs = require('./packages/area/src/data/prefectures.json');
const historical = docs.values;
assert.equal(historical.metricKey, key);
assert.equal(historical.entityKind, 'prefecture');
assert.equal(historical.rows.length, 1833);
for (const p of prefs) {
  const raw = rows.find((r) => r['@area'] === p.prefCode);
  assert.ok(raw);
  const target = historical.rows.filter(
    (r) => r.areaCode === p.prefCode && r.yearCode === '2024'
  );
  assert.equal(target.length, 1);
  assert.equal(target[0].areaName, p.prefName);
  assert.equal(target[0].unit, '人');
  assert.equal(target[0].value, Number(raw.$));
}
assert.equal(
  rows
    .filter((r) => r['@area'] !== '00000')
    .reduce((s, r) => s + Number(r.$), 0),
  57387
);
assert.equal(Number(rows.find((r) => r['@area'] === '00000').$), 57387);
const config = require('./packages/data-configs/src/registry.ts')
  .METRICS_REGISTRY[key];
assert.equal(config.yearFormat, 'calendar');
assert.equal(config.source.statsDataId, '0000010111');
assert.equal(config.source.cdCat01, 'K310203');
assert.equal(config.unit, '人');
assert.deepEqual(config.years, { from: 1986, to: 2024 });
const { buildRecipe } = require('./packages/data-configs/src/recipe.ts');
const {
  parseStatsValuesPayload,
} = require('./packages/stats-r2/src/schemas.ts');
const generatedAt = new Date().toISOString();
const payload = parseStatsValuesPayload({
  ...historical,
  rows: historical.rows.map((r) => ({ ...r, yearName: r.yearCode + '年' })),
  meta: { ...historical.meta, generatedAt, recipe: buildRecipe(config) },
});
assert.deepEqual(
  JSON.parse(JSON.stringify(payload.rows.map(({ yearName, ...r }) => r))),
  historical.rows.map(({ yearName, ...r }) => r),
  'historical values untouched'
);
const content = Buffer.from(JSON.stringify(payload)),
  path = resolve(root, '.local/r2/app/stats', key, 'values.json');
if (o['write-local']) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}
const report = {
  status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
  generatedAt,
  metricKey: key,
  candidate: 88,
  receipts,
  checks: {
    matchedPrefectures: 47,
    preservedRows: 1833,
    preservedYears: 39,
    national: 57387,
    periodCorrection: 'calendar; SSDS display metadata says fiscal',
  },
  sourceRows: rows,
  files: [
    {
      key: 'app/stats/' + key + '/values.json',
      sha256: sha(content),
      bytes: content.length,
      rowCount: 1833,
    },
  ],
};
await writeFile(o.out, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({ status: report.status, matched: 47, preservedRows: 1833 })
);
