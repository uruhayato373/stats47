#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(resolve(root, 'package.json'));
const {
  WATER_QUALITY_SOURCE: source,
} = require('./packages/data-configs/src/theme-catalog/water-quality-source.ts');
const {
  waterQualitySnapshotSchema,
} = require('./apps/web/src/features/water-quality/lib/water-quality-snapshot.ts');
const prefs = require('./packages/area/src/data/prefectures.json');
const sha = (b) => createHash('sha256').update(b).digest('hex');
export function buildWaterQualitySnapshot(extracted) {
  assert.equal(extracted.rows.length, 3427, 'all original rows');
  const byName = new Map(prefs.map((p) => [p.prefName, p.prefCode]));
  const rows = extracted.rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    page: r.page,
    row: Number(r.id.match(/-r(\d+)$/)?.[1]),
    listingAreaCode: byName.get(r.prefectures[0]),
    relatedAreaCodes: r.prefectures.map((n) => byName.get(n)),
    name: r.name,
    kana: r.kana,
    class: r.class,
    limit: r.limit,
    value75: r.value75,
    mean: r.mean,
    compliant: r.judgment === '○',
  }));
  for (const kind of ['river', 'lake', 'sea']) {
    const codes = rows
      .filter((r) => r.kind === kind)
      .map((r) => r.listingAreaCode);
    assert.ok(
      codes.every((c, i) => !i || c >= codes[i - 1]),
      '原表の県別掲載順を保持'
    );
  }
  return waterQualitySnapshotSchema.parse({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    period: source.period,
    source: {
      title: source.title,
      url: source.url,
      sha256: source.sha256,
      mainUrl: source.mainUrl,
      mainSha256: source.mainSha256,
    },
    national: source.national,
    prefectures: prefs.map((p) => ({
      areaCode: p.prefCode,
      areaName: p.prefName,
    })),
    rows,
    notes: source.notes,
  });
}
async function main() {
  const { values: o } = parseArgs({
    options: {
      'source-dir': {
        type: 'string',
        default: '.local/verification/themes/water-quality-source',
      },
      'local-r2-root': { type: 'string', default: '.local/r2' },
      out: {
        type: 'string',
        default: '.local/verification/themes/water-quality-source.json',
      },
      'write-local': { type: 'boolean', default: false },
    },
  });
  const dir = resolve(root, o['source-dir']);
  await mkdir(dir, { recursive: true });
  for (const [file, expected] of [
    ['appendix-2023.pdf', source.sha256],
    ['main-2023.pdf', source.mainSha256],
    ['kagawa-2023.pdf', source.anomaly.prefecturalSourceSha256],
  ])
    assert.equal(
      sha(await readFile(resolve(dir, file))),
      expected,
      `official source SHA ${file}`
    );
  execFileSync('pdftotext', [
    '-bbox-layout',
    resolve(dir, 'appendix-2023.pdf'),
    resolve(dir, 'appendix-2023.html'),
  ]);
  execFileSync('python3', [
    resolve(root, '.claude/scripts/themes/extract-water-quality.py'),
    '--bbox',
    resolve(dir, 'appendix-2023.html'),
    '--out',
    resolve(dir, 'extracted.json'),
  ]);
  const raw = JSON.parse(
    await readFile(resolve(dir, 'extracted.json'), 'utf8')
  );
  const snapshot = buildWaterQualitySnapshot(raw),
    body = Buffer.from(JSON.stringify(snapshot, null, 2) + '\n');
  if (o['write-local']) {
    const dest = resolve(root, o['local-r2-root'], source.r2Key);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, body);
  }
  const proof = {
    status: 'PASS',
    generatedAt: new Date().toISOString(),
    writeLocal: o['write-local'],
    sourceSha256: source.sha256,
    mainSourceSha256: source.mainSha256,
    prefecturalSourceSha256: source.anomaly.prefecturalSourceSha256,
    prefectures: 47,
    sourceRows: snapshot.rows.length,
    rowsByKind: source.rowCounts,
    anomalies: raw.anomalies,
    nationalAggregation:
      'official-main-table-3-1-not-derived-from-prefecture-rows',
    files: [{ key: source.r2Key, sha256: sha(body), bytes: body.length }],
    limits: [
      '2023 fiscal-year source; not latest',
      'Original prefecture listing rows retained; cross-prefecture waters are not deduplicated by name',
      'Kagawa Nishi-Shioiri source class discrepancy preserved; no change to published compliant decision',
    ],
  };
  await mkdir(dirname(resolve(root, o.out)), { recursive: true });
  await writeFile(resolve(root, o.out), JSON.stringify(proof, null, 2) + '\n');
  console.log(JSON.stringify(proof));
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
