import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { inspectPack, sha256 } from './lib/pack-evidence.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(resolve(root, 'package.json'));
require('tsx/cjs');
const { buildDatabook } = require(resolve(root, 'packages/product-factory/src/build/build-databook.ts'));
const { PACKS } = require(resolve(root, 'packages/product-factory/src/catalog/products/packs.ts'));
const { METRICS_REGISTRY } = require('@stats47/data-configs');
const { productIndicatorLabel } = require(resolve(root, 'packages/product-factory/src/data/product-indicator-label.ts'));
const argv = process.argv.slice(2);
const id = argv[argv.indexOf('--id') + 1];
if (!argv.includes('--id') || !/^P-\d\d$/.test(id)) throw new Error('--id P-XX required');
const listing = JSON.parse(readFileSync(resolve(root, '.claude/config/coconala-listings.json'))).listings[id];
const product = PACKS.find(p => p.id === id);
if (!product || !listing) throw new Error('Unknown pack');
const originalContract = { ...listing, _delivery: { ...listing._delivery,
  artifactDirectory: `.local/coconala-products/${id}/v1`,
  manifestSha256: listing._delivery.originalManifestSha256 ?? listing._delivery.manifestSha256 } };
const evidence = await inspectPack(root, originalContract);
const version = 'v2-20260906-r1';
const outDir = resolve(root, '.local/coconala-products', id, version);
if (existsSync(outDir)) throw new Error('Immutable revision exists; do not overwrite');
const repairs = [];
const metadataExceptions = [];
const datasets = evidence.sources.map((s, i) => {
  const key = s['加工式'].match(/app\/ranking\/([^/]+)\//)?.[1];
  const cfg = METRICS_REGISTRY[key];
  if (!key || !cfg) throw new Error(`Missing ranking source: ${i}`);
  if (String(cfg.source?.statsDataId ?? cfg.source?.filter?.statsDataId ?? '-') !== s.statsDataId) throw new Error(`Frozen source changed: ${key}`);
  const suffix = `（${s['単位']}・${s['年']}）`;
  const oldHeader = evidence.rows[0][i + 2];
  if (!oldHeader.endsWith(suffix)) throw new Error(`Column/source mismatch: ${key}`);
  const oldName = oldHeader.slice(0, -suffix.length);
  let indicator = productIndicatorLabel(key, cfg, s['表名']);
  let notes = s['注意事項'];
  if (['0003348239', '0003348235'].includes(s.statsDataId)) {
    indicator = oldName + '（県庁所在市・二人以上世帯・1世帯当たり年間）';
    notes += ' 県名は対応コードの表示であり、値は県庁所在市（東京都は区部）の二人以上世帯。県全体の平均ではありません。';
  }
  if (['kindergarten-education-diffusion-rate', 'nursery-education-diffusion-rate'].includes(key)) {
    notes += ' 旧版の歴史系列を保持。2026-09-06の現行APIメタデータに同コードがないため、現行定義との再照合は未実施。最新状況の判断には利用しないでください。';
    metadataExceptions.push(key);
  }
  if (indicator !== oldName) repairs.push({ key, from: oldName, to: indicator });
  const values = evidence.rows.slice(1).map(row => {
    const cell = row[i + 2];
    if (cell !== '') {
      if (!/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(cell)) throw new Error(`Invalid numeric cell: ${key}`);
      return { code5: row[0], value: Number(cell) };
    }
    const reasons = [...new Set(row.at(-1).split(' / ').filter(x => x.startsWith(oldName + '=')).map(x => x.slice(oldName.length + 1)))];
    if (reasons.length !== 1 || !['欠損', '秘匿', '非該当'].includes(reasons[0])) throw new Error(`Ambiguous missing reason: ${key}`);
    return { code5: row[0], value: null, missing: { 欠損: 'missing', 秘匿: 'confidential', 非該当: 'na' }[reasons[0]] };
  });
  return { indicator, unit: s['単位'], year: s['年'], category: cfg.category, isSample: false, values,
    source: { surveyName: s['調査名'], tableName: indicator, statsDataId: s.statsDataId, url: s.URL,
      year: s['年'], retrievedAt: s['取得日'], unit: s['単位'], transform: s['加工式'], notes } };
});
console.log(JSON.stringify({ id, stage: 'input-verified', count: datasets.length, repairs: repairs.length, metadataExceptions }));
if (!argv.includes('--build')) process.exit(0);
const revisedProduct = { ...product, name: listing.title.replace(/をお渡しします$/, ''), dataMode: 'fixed-year' };
const result = await buildDatabook(revisedProduct, { title: revisedProduct.name, datasets }, { version });
// This receipt records a label/layout revision, NOT an official re-fetch of every observation.
writeFileSync(resolve(outDir, 'revision-audit.json'), JSON.stringify({ id, revision: version, createdAt: new Date().toISOString(),
  originalManifestSha256: evidence.manifestSha256, manifestSha256: sha256(readFileSync(resolve(outDir, 'manifest.json'))),
  indicatorCount: datasets.length, repairs, metadataExceptions, observationsChanged: 0, observationsRefetched: false,
  officeValidation: 'owner-pending' }, null, 2) + '\n');
console.log(JSON.stringify({ id, stage: 'built', outDir: result.outDir, repairs: repairs.length }));
