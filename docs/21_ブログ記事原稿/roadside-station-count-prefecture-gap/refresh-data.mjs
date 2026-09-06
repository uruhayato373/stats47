/** Approved 2026 refresh of three existing roadside articles. No remote writes. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '../../..');
const slugs = ['roadside-station-count-prefecture-gap', 'roadside-station-count-vs-forest-road-length', 'roadside-station-prefecture-gap'];
const evidence = path.join(root, '.local/license-remediation/roadside-refresh-20260906');
const dir = slug => path.join(root, 'docs/21_ブログ記事原稿', slug);
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, d) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n'); };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const inputs = [];
async function get(key) {
  const url = `https://storage.stats47.jp/${key}`;
  const r = await fetch(url); assert.equal(r.status, 200, url);
  const bytes = Buffer.from(await r.arrayBuffer());
  const file = path.join(evidence, 'inputs', key);
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes);
  inputs.push({ key, url, file, bytes: bytes.length, sha256: sha(bytes), etag: r.headers.get('etag') });
  return JSON.parse(bytes);
}
const raw = await get('app/ranking/roadside-station-count/values.json');
const stats = await get('app/stats/roadside-station-count/values.json');
const item = await get('app/ranking/roadside-station-count/item.json');
const area = await get('app/ranking/roadside-station-count/values-per-area.json');
const denominator = await get('app/stats/total-area-including-northern-territories-and-takeshima/values.json');
const control = await get('app/stats/total-area-excluding-northern-territories-and-takeshima/values.json');
const forest = await get('app/ranking/forest-road-length/values.json');
const correlation = await get('app/correlation/by-ranking-key/roadside-station-count.json');
const obs = raw.partitions.find(p => p.yearCode === '2026').values;
assert.equal(obs.length, 47); assert.equal(new Set(obs.map(r => r.areaCode)).size, 47);
assert.equal(obs.reduce((n, r) => n + r.value, 0), 1234);
assert.equal(stats.meta.source.sourceSha256, '20a0f50794942de07327e7a9561d4a98390032b7a2147e1903db19dcb6d52486');
for (const [index, slug] of slugs.entries()) {
  execFileSync(process.execPath, ['.claude/scripts/blog/fetch-ranking-data-r2.mjs', '--slug', slug, '--keys', index === 1 ? 'roadside-station-count,forest-road-length' : 'roadside-station-count', ...(index === 0 ? ['--with-map'] : []), ...(index === 2 ? ['--data-name', 'roadside-station-ranking'] : [])], { cwd: root, stdio: 'inherit' });
  for (const file of fs.readdirSync(path.join(dir(slug), 'data')).filter(f => f.endsWith('.source.json'))) {
    const p = path.join(dir(slug), 'data', file), d = read(p);
    if (d.kind !== 'ranking') continue;
    if (d.rankingKey !== 'roadside-station-count') {
      if (d.rankingKey === 'forest-road-length') {
        const dataPath = p.replace('.source.json', '.json'), data = read(dataPath);
        data.subtitle = '2022年度'; write(dataPath, data);
      }
      continue;
    }
    d.upstream = '国土交通省の公式登録一覧 XLSX → 47県の登録駅数 → R2 app/ranking';
    d.dataDate = '2026-09-04'; d.sourceSha256 = stats.meta.source.sourceSha256;
    d.sourceUrl = item.item.sourceConfig.source.url;
    d.surveyScope = 'not-applicable';
    d.surveyScopeReason = '統計調査の集計表ではなく、国土交通省の道の駅登録台帳を所在地の都道府県別に数えた登録駅数。';
    d.inputSha256 = inputs.find(i => i.key === 'app/ranking/roadside-station-count/values.json').sha256;
    d.restore = 'node docs/21_ブログ記事原稿/roadside-station-count-prefecture-gap/refresh-data.mjs';
    write(p, d);
    const dataPath = p.replace('.source.json', '.json'), data = read(dataPath);
    assert.equal(data.year, '2026');
    for (const row of data.data) assert.equal(row.value, obs.find(o => o.areaName === row.areaName).value);
    data.subtitle = '2026年9月4日の登録駅数'; data.palette = 'purple'; data.rightPalette = 'blue';
    write(dataPath, data);
  }
}
const density = area.partitions.find(p => p.yearCode === '2026').values;
assert.equal(area.meta.normalizationBasis.usedYearCode, '2023');
assert.equal(inputs.find(i => i.key === 'app/stats/total-area-including-northern-territories-and-takeshima/values.json').sha256, area.meta.normalizationBasis.sha256);
for (const row of density) {
  const count = obs.find(r => r.areaCode === row.areaCode).value;
  const baseArea = denominator.rows.find(r => r.areaCode === row.areaCode && r.yearCode === '2023').value * area.meta.normalizationBasis.valueScaleToBaseUnit;
  assert.ok(Math.abs(row.value - count / baseArea * area.meta.normalizationBasis.scaleFactor) < 1e-12);
}
const densityBase = path.join(dir(slugs[2]), 'data/roadside-station-density-ranking');
write(densityBase + '.json', { title: '総面積100km²あたりの道の駅数', label: '総面積100km²あたりの道の駅数', subtitle: '登録駅数2026年・総面積2023年', unit: 'か所', year: '2026', data: density.map(r => ({ ...r, pref: r.areaName, unit: 'か所', label: '総面積100km²あたりの道の駅数' })), palette: 'purple', rightPalette: 'blue' });
write(densityBase + '.source.json', { kind: 'derived', rankingKey: 'roadside-station-count', year: '2026', unit: 'か所/100km²', source: 'r2:app/ranking/roadside-station-count/values-per-area.json', inputSha256: inputs.find(i => i.key.endsWith('values-per-area.json')).sha256, transform: '2026年登録駅数 ÷ 2023年総面積(km²) × 100。R2の確定済み正規化値を無丸めで使用。北方領土・竹島を含む総面積。', denominator: { ...area.meta.normalizationBasis, path: undefined, numeratorPath: undefined }, surveyScope: 'not-applicable', surveyScopeReason: '道の駅登録台帳の駅数を総面積で除した独自派生指標であり、統計調査が公表した道の駅密度ではない。', restore: 'node docs/21_ブログ記事原稿/roadside-station-count-prefecture-gap/refresh-data.mjs' });
execFileSync(process.execPath, ['.claude/scripts/blog/fetch-correlation-scatter.mjs', '--slug', slugs[1], '--base', 'roadside-station-count', '--pair', 'forest-road-length'], { cwd: root, stdio: 'inherit' });
const pair = correlation.pairs.find(p => p.rankingKey === 'forest-road-length');
const recomputed = JSON.parse(execFileSync(process.execPath, ['--import', 'tsx', '-e', `const fs=require('node:fs'); const {calculatePearsonR,calculatePartialR}=require('./packages/correlation/src/utils/calculate-pearson.ts'); const {points,rows}=JSON.parse(fs.readFileSync(0,'utf8')); const x=points.map(r=>r.x), y=points.map(r=>r.y), z=points.map(r=>rows.find(a=>a.areaCode===r.areaCode && a.yearCode==='2024').value); const r=calculatePearsonR(x,y).r; console.log(JSON.stringify({pearsonR:r,partialRArea:calculatePartialR(r,calculatePearsonR(x,z).r,calculatePearsonR(y,z).r)}));`], { cwd: root, input: JSON.stringify({ points: pair.scatterData, rows: control.rows }), encoding: 'utf8' }));
assert.ok(Math.abs(recomputed.pearsonR - pair.pearsonR) < 1e-12);
assert.ok(Math.abs(recomputed.partialRArea - pair.partialRArea) < 1e-12);
const forestRows = forest.partitions.find(p => p.yearCode === '2022').values;
for (const row of pair.scatterData) {
  assert.equal(row.x, obs.find(o => o.areaCode === row.areaCode).value);
  assert.equal(row.y, forestRows.find(o => o.areaCode === row.areaCode).value);
}
const scatterBase = path.join(dir(slugs[1]), 'data/roadside-station-count--forest-road-length-scatter');
const scatter = read(scatterBase + '.json');
Object.assign(scatter, { title: '道の駅数と林道延長', xLabel: '道の駅数（2026年）', xUnit: 'か所', yLabel: '林道延長（2022年度）', yUnit: 'km', pearsonR: pair.pearsonR, partialRArea: pair.partialRArea });
write(scatterBase + '.json', scatter);
const scatterSource = read(scatterBase + '.source.json');
Object.assign(scatterSource, { year: '2026 / 2022', xYear: '2026', yYear: '2022', unit: 'か所 × km', label: '道の駅数と林道延長', partialRArea: pair.partialRArea, areaControl: { key: control.metricKey, year: '2024', source: `r2:app/stats/${control.metricKey}/values.json`, sha256: inputs.find(i => i.key === `app/stats/${control.metricKey}/values.json`).sha256 }, inputSha256: inputs.find(i => i.key.includes('correlation')).sha256, restore: 'node docs/21_ブログ記事原稿/roadside-station-count-prefecture-gap/refresh-data.mjs' });
write(scatterBase + '.source.json', scatterSource);
for (const slug of slugs) {
  const article = fs.readFileSync(path.join(dir(slug), 'article.md'), 'utf8');
  write(path.join(dir(slug), 'ogp/ogp.json'), { title: article.match(/^title: (.+)$/m)[1], subtitle: article.match(/^subtitle: (.+)$/m)[1] });
}
write(path.join(evidence, 'input-manifest.json'), { fetchedAt: new Date().toISOString(), inputs, total: 1234, count: 47, pearsonR: pair.pearsonR, partialRArea: pair.partialRArea });
console.log('All 47 counts, density definition, and all 47 scatter pairs verified.');
