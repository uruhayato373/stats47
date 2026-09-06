import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { generateChoroplethSvg } from '../../../packages/svg-builder/src/charts/index.ts';

// Usage: tsx generate-data.ts <verified local app/geo/population-land-price directory>
const input = path.resolve(process.argv[2]);
const output = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
fs.mkdirSync(output, { recursive: true });
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const refs: { key: string; sha256: string; bytes: number }[] = [];
const read = (name: string) => {
  const b = fs.readFileSync(path.join(input, name));
  refs.push({ key: `app/geo/population-land-price/${name}`, sha256: sha(b), bytes: b.length });
  return JSON.parse(b.toString());
};
const item = read('item.json');
const manifest = read('manifest.json');
assert.equal(refs[0].sha256, manifest.aggregate.sha256);
assert.equal(item.rows.length, 47);
assert.equal(manifest.quality.conservationChecks, 47);
const totals = { pointCount: 0, matchedPointCount: 0, unmatchedPointCount: 0, comparablePointCount: 0, risingDecliningPointCount: 0, meshCount: 0, missingChange: 0, zeroPopulation: 0 };
const cases: any[] = [];
for (let n = 1; n <= 47; n++) {
  const name = `pref/${String(n).padStart(2, '0')}.json`;
  const p = read(name);
  const expected = manifest.stages.flatMap((s: any) => s.outputs).find((o: any) => o.key === refs.at(-1)?.key);
  assert.equal(refs.at(-1)?.sha256, expected.sha256);
  assert.equal(p.generatedAt, item.generatedAt);
  const meshes = new Map<string, any[]>(p.meshes.map((m: any[]) => [m[0], m]));
  let matched = 0, comparable = 0, selected = 0;
  assert.equal(p.landPricePoints.length, p.pointMeshIds.length);
  p.landPricePoints.forEach((point: any[], i: number) => {
    const mesh = meshes.get(p.pointMeshIds[i]);
    if (!mesh) return;
    matched++;
    assert(point[1] >= mesh[1] && point[1] < mesh[3] && point[2] >= mesh[2] && point[2] < mesh[4]);
    if (point[4] === null) { totals.missingChange++; return; }
    if (mesh[5] <= 0) { totals.zeroPopulation++; return; }
    comparable++;
    if (point[4] > 0 && mesh[6] < mesh[5]) {
      selected++;
      if (p.areaCode === '13000' && cases.length === 0) cases.push({ areaName: p.areaName, point, mesh });
    }
  });
  assert.equal(matched, p.summary.matchedPointCount);
  assert.equal(comparable, p.summary.comparablePointCount);
  assert.equal(selected, p.summary.risingDecliningPointCount);
  const row = item.rows.find((r: any) => r.areaCode === p.areaCode);
  for (const key of ['pointCount', 'matchedPointCount', 'unmatchedPointCount', 'comparablePointCount', 'risingDecliningPointCount', 'meshCount'] as const) {
    assert.equal(p.summary[key], row.values[key]);
    totals[key] += p.summary[key];
  }
  assert.equal(Math.round(selected / comparable * 1000) / 10, row.values.risingDecliningPointShare);
}
const write = (name: string, data: unknown) => fs.writeFileSync(path.join(output, name), JSON.stringify(data, null, 2) + '\n');
const source = { kind: 'derived', source: 'r2:app/geo/population-land-price/item.json', sourceName: '国土交通省の将来推計人口メッシュ・地価公示をstats47が包含結合', generatedAt: item.generatedAt, retrievedAt: new Date().toISOString(), inputs: refs, transform: '各地点を同県メッシュ[西,東)×[南,北)へ包含結合。前年比欠測・2020人口0・未接続を除外し、前年比>0かつ2050人口<2020人口の地点数/比較可能地点数×100。', restore: 'npx tsx docs/21_ブログ記事原稿/population-decline-land-price-divergence/generate-data.ts <verified-geo-bundle>' };
const data = item.rows.map((r: any) => ({ areaName: r.areaName, areaCode: r.areaCode, value: r.values.risingDecliningPointShare, label: '地価上昇かつ人口減少の地点割合', unit: '%', ...r.values }));
write('land-price-spatial-evidence.json', { generatedAt: item.generatedAt, totals, nationalShare: Math.round(totals.risingDecliningPointCount / totals.comparablePointCount * 1000) / 10, prefectures: data, cases, source: item.sources, method: item.method });
write('land-price-spatial-evidence.source.json', source);
const map = { title: '地価上昇 × メッシュ人口減少', subtitle: '比較可能な住宅地点に占める割合', unit: '%', scheme: 'Blues', data };
write('land-price-spatial-map.json', map);
write('land-price-spatial-map.source.json', source);
fs.writeFileSync(path.join(output, 'land-price-spatial-map.svg'), generateChoroplethSvg(data.map((r: any) => ({ code: r.areaCode.slice(0, 2), name: r.areaName, value: r.value })), map));
const tokyo = data.find((r: any) => r.areaCode === '13000');
const c = cases[0];
const steps = [
  ['計算入力', `人口メッシュ ${totals.meshCount.toLocaleString('en-US')}件 ＋ 住宅地点 ${totals.pointCount.toLocaleString('en-US')}件`],
  ['位置で接続', `接続 ${totals.matchedPointCount.toLocaleString('en-US')}地点 ／ 未接続 ${totals.unmatchedPointCount}地点`],
  ['比較対象を選別', `比較可能 ${totals.comparablePointCount.toLocaleString('en-US')}地点 → 該当 ${totals.risingDecliningPointCount.toLocaleString('en-US')}地点`],
  ['東京都で検算', `${tokyo.risingDecliningPointCount} ÷ ${tokyo.comparablePointCount.toLocaleString('en-US')} × 100 ＝ ${tokyo.value}%`],
];
write('land-price-spatial-lineage.json', { title: '県コードではなく地点の位置で結合', steps, example: c });
write('land-price-spatial-lineage.source.json', source);
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720" role="img" aria-label="住宅地点と人口メッシュの包含結合と東京都での検算"><style>text{font-family:'Noto Sans JP','Hiragino Sans',sans-serif;fill:#334155}.panel{fill:#f1f5f9}.title{font-weight:700;font-size:25px}.label{font-weight:700;font-size:21px}.body{font-size:19px}@media(prefers-color-scheme:dark){text{fill:#e2e8f0}.panel{fill:#1e293b}}</style><text x="30" y="48" class="title">県コードではなく地点の位置で結合</text>${steps.map(([label, body], i) => `<rect x="30" y="${78 + i * 110}" width="660" height="85" rx="8" class="panel"/><text x="50" y="${108 + i * 110}" class="label">${escape(label)}</text><text x="50" y="${141 + i * 110}" class="body">${escape(body)}</text>${i < 3 ? `<path d="M360 ${167 + i * 110}v14m-5-5 5 5 5-5" fill="none" stroke="#64748b" stroke-width="2"/>` : ''}`).join('')}<text x="30" y="565" class="label">1地点の追跡例：${c.point[0]}</text><text x="30" y="600" class="body">地価前年比 +${c.point[4]}% → 人口メッシュ ${c.mesh[0]}</text><text x="30" y="634" class="body">2020年 ${c.mesh[5]}人 → 2050年 ${c.mesh[6]}人</text><text x="30" y="685" class="body">期間の異なる値の重なり。将来地価・因果は推定しません。</text></svg>`;
fs.writeFileSync(path.join(output, 'land-price-spatial-lineage.svg'), svg);
console.log(JSON.stringify({ status: 'PASS', areas: 47, totals, example: c, generatedAt: item.generatedAt }));
