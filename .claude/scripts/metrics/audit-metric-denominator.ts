/**
 * audit-metric-denominator.ts — 人口当たりを名乗る指標が、実数のままになっていないかを値で確かめる。
 *
 * 人口当たりの値が県の総人口にほぼ比例することはない。2026-09-24 に見つかった、人口10万対の指標が
 * 実数の列を指す誤りは、題名も単位も正しく見えるので形の検査では止まらず、値を見ないと分からなかった。
 * 最新年の 47 県の値と総人口の相関が MAX_POPULATION_R 以上なら失敗にする。
 * 実数を意図した指標は定義に `denominator: 'none'` を書く。
 *
 * Usage: npx tsx .claude/scripts/metrics/audit-metric-denominator.ts
 * 出力: data/data-quality/checks/metric-denominator.json
 * 呼び元: 週次レビューの ranking-integrity (exit 1 で落ちた検査として出る)
 */
import fs from 'node:fs';
import path from 'node:path';

import { datasetDir } from '../../../config/datasets.mjs';
import { R2_PUBLIC_BASE_URL } from '../lib/site-config.cjs';
import { METRICS_REGISTRY } from '../../../packages/data-configs/src/registry';
import { metricDenominatorOf } from '../../../packages/data-configs/src/metric-denominator';

// 看護師の誤りのころの値は総人口との相関がこれを大きく超えていた。正常な率の上限は 2026-11-04 の実測で 0.86
const MAX_POPULATION_R = 0.93;
const MIN_AREAS = 40;
const CONCURRENCY = 6;
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const PREFECTURE = /^(?!00000)\d{2}000$/;

type Row = { areaCode: string; yearCode: string; value: number | null };

export function pearson(a: number[], b: number[]) {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
  let c = 0, x = 0, y = 0;
  for (let i = 0; i < n; i++) {
    c += (a[i] - ma) * (b[i] - mb);
    x += (a[i] - ma) ** 2;
    y += (b[i] - mb) ** 2;
  }
  return c / Math.sqrt(x * y);
}

const rowsOf = async (key: string): Promise<Row[] | null> => {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(`${R2}/app/stats/${key}/values.json`);
      if (res.status === 404) return null;
      if (res.ok) return (await res.json()).rows ?? null;
    } catch { /* 取り直す */ }
    await new Promise((d) => setTimeout(d, 1000 * (i + 1)));
  }
  throw new Error(`取得できない: ${key}`);
};

async function main() {
  const population = (await rowsOf('total-population'))!.filter((r) => PREFECTURE.test(r.areaCode) && r.value !== null);
  const popYears = [...new Set(population.map((r) => r.yearCode))].sort();
  const targets = Object.values(METRICS_REGISTRY).filter((m) => m.isActive && metricDenominatorOf(m) === 'population');
  const results: { key: string; title: string; year: string; r: number }[] = [];
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < targets.length) {
      const metric = targets[i++];
      const rows = (await rowsOf(metric.key))?.filter((r) => PREFECTURE.test(r.areaCode) && r.value !== null);
      if (!rows?.length) continue;
      const year = [...new Set(rows.map((r) => r.yearCode))].sort().at(-1)!;
      const popYear = popYears.filter((y) => y <= year).at(-1) ?? popYears[0];
      const pop = new Map(population.filter((r) => r.yearCode === popYear).map((r) => [r.areaCode, r.value!]));
      const pairs = rows.filter((r) => r.yearCode === year && pop.has(r.areaCode));
      if (pairs.length < MIN_AREAS) continue;
      results.push({ key: metric.key, title: metric.title, year, r: Number(pearson(pairs.map((r) => r.value!), pairs.map((r) => pop.get(r.areaCode)!)).toFixed(3)) });
    }
  }));
  results.sort((a, b) => b.r - a.r);
  const flagged = results.filter((r) => r.r >= MAX_POPULATION_R);
  const out = path.join(path.resolve(__dirname, '../../..'), datasetDir('data-quality.checks'), 'metric-denominator.json');
  fs.writeFileSync(out, `${JSON.stringify({ checked: results.length, threshold: MAX_POPULATION_R, flagged, highest: results.slice(0, 10) }, null, 2)}\n`);
  console.log(`[metric-denominator] ${results.length} 指標を確認: 実数の疑い ${flagged.length} 件 (最大 r=${results[0]?.r})`);
  for (const f of flagged) console.error(`  ${f.key} (${f.title}) r=${f.r} ${f.year}`);
  if (flagged.length) process.exit(1);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
