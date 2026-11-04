/**
 * audit-chart-axes.ts — 公開中のブログ散布図を「値」で検査する。
 *
 * 形の検査 (source.json に key がある) だけでは、key が別の指標を指していても合格する。2026-11-04 に
 * 記事リンクから推定した rankingKeys が軸の指標と違う図、点データ (json) が無い図、県名が化けた図が
 * 公開中のまま見つかった。ここでは記事が実際に表示する散布図を 1 枚ずつ開き、次を確かめる:
 *   - json と source.json がある
 *   - source.json の形 (config/schema/blog.chart-source.schema.json)
 *   - axes があり、proof=values の軸は全点が観測値で再現できる (matchScatterAxis)
 *   - 図が共通の型の画像になっている / 暗い版がある
 *   - ランキングと地図の図は、記事の点データが指標の今の値と同じか (stale-value)。指標を直しても記事の図は
 *     公開時の写しのままなので、ここで見つけて是正キューの data-refresh へ入れる
 *
 * Usage:
 *   npx tsx .claude/scripts/blog/audit-chart-axes.ts                       # 公開 R2 全件 → data/blog/chart-axes-*
 *   npx tsx .claude/scripts/blog/audit-chart-axes.ts --base .local/r2/app/blog --slugs a,b --no-write  # CI の手元の図
 *
 * 出力: data/blog/chart-axes-queue.json (機械用・週次のラチェットが summary を読む) / chart-axes-LATEST.md
 * 正典: .claude/rules/blog-svg-chart-standards.md §0
 */
import fs from 'node:fs';
import path from 'node:path';

import { datasetDir } from '../../../config/datasets.mjs';
import { prefectureShortName } from '../../../packages/area/src/utils/prefecture-short-name';
import { R2_PUBLIC_BASE_URL } from '../lib/site-config.cjs';
import { chartSourceShapeErrors } from '../lib/chart-source-schema.mjs';
import { PREF_NAMES } from '../lib/prefectures.cjs';
import { matchScatterAxis, type ChartAxisRecord } from './lib/type-chart-input';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const args = process.argv.slice(2);
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const BASE = flag('--base');
const NO_WRITE = args.includes('--no-write');
const CONCURRENCY = 6;

export type ChartAxesIssue = 'no-data' | 'no-source' | 'bad-shape' | 'no-axes' | 'axis-mismatch' | 'not-type' | 'no-dark' | 'broken-label';
/** 記事の図の値が指標の今の値と違う */
export type StaleChart = { slug: string; base: string; rankingKey: string; year: string };

const fetchText = async (url: string) => {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (res.ok) return res.text();
    } catch { /* 取り直す */ }
    await new Promise((d) => setTimeout(d, 1000 * (i + 1)));
  }
  throw new Error(`取得できない: ${url}`);
};
const blogFile = async (slug: string, name: string) => {
  if (!BASE) return fetchText(`${R2}/app/blog/${slug}/${name}`);
  const p = path.join(BASE, slug, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
};
const valuesCache = new Map<string, Promise<unknown[] | null>>();
const valuesOf = (key: string) => {
  if (!valuesCache.has(key)) {
    valuesCache.set(key, fetchText(`${R2}/app/stats/${key}/values.json`).then((t) => (t ? JSON.parse(t).rows ?? null : null)));
  }
  return valuesCache.get(key)!;
};

const shortToCode = new Map<string, string>();
(PREF_NAMES as string[]).forEach((name, i) => {
  const code = String(i + 1).padStart(2, '0');
  shortToCode.set(name, code);
  shortToCode.set(prefectureShortName(name), code);
});

/** 記事が表示する散布図の basename */
export function scatterChartsOf(markdown: string) {
  return [...new Set([...markdown.matchAll(/data\/([\w-]*scatter[\w-]*)\.svg/g)].map((m) => m[1]))].filter((b) => !b.endsWith('-dark'));
}

// 丸めの違いは誤りではない (半端の丸め方で最終桁が 1 つ動く)
const LAST_DIGIT_TOLERANCE = 1.5;
const SCALES = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e8, 0.1, 0.01, 0.001];

/** 点の値が観測値を最終桁の違いまでで再現するか。桁の違う書き方 (万人など) も見る */
export function reproducesValues(points: { code: string; value: number }[], observed: Map<string, number>) {
  return SCALES.some((scale) => points.every((p) => {
    const v = observed.get(p.code);
    if (v === undefined) return false;
    const digits = (String(p.value).split('.')[1] ?? '').length;
    return Math.abs(v / scale - p.value) <= LAST_DIGIT_TOLERANCE * 10 ** -digits;
  }));
}

/** 本文の図のうち、指標と年で値を照らせる図 */
export function rankedChartsOf(markdown: string) {
  return [...new Set([...markdown.matchAll(/data\/([\w-]+)\.svg/g)].map((m) => m[1]))].filter((b) => !/scatter|-dark$|-ig$|-mobile$/.test(b));
}

/** ランキング・地図の点データが、書かれた年の指標の値を今も再現するか。照らせない図は null */
async function staleChart(slug: string, base: string): Promise<StaleChart | null> {
  const sourceText = await blogFile(slug, `data/${base}.source.json`);
  const dataText = await blogFile(slug, `data/${base}.json`);
  if (!sourceText || !dataText) return null;
  const source = JSON.parse(sourceText), data = JSON.parse(dataText);
  const rankingKey = source.rankingKey ?? source.metricKey;
  const year = String(source.year ?? '');
  if (!['ranking', 'metric'].includes(source.kind) || typeof rankingKey !== 'string' || /[+|]/.test(rankingKey) || !/^\d{4}$/.test(year)) return null;
  const raw = (Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.rows) ? data.rows : []) as Record<string, unknown>[];
  const points = raw.filter((p) => typeof p.value === 'number').map((p) => ({ value: p.value as number, code: p.areaCode ? String(p.areaCode).slice(0, 2) : shortToCode.get(String(p.areaName ?? p.label ?? p.pref ?? p.name ?? '').replace(/\uFFFD/g, '')) }));
  // 県の 1 年分の図だけを照らす。市区町村の図 (47 県より多い) や時系列の図は別の形
  if (points.length < 5 || points.length > 47 || points.some((p) => !p.code) || new Set(points.map((p) => p.code)).size !== points.length) return null;
  const rows = (await valuesOf(rankingKey)) as { yearCode: string; areaCode: string; value: number | null }[] | null;
  const observed = new Map(rows?.filter((r) => r.yearCode === year && r.value !== null).map((r) => [r.areaCode.slice(0, 2), r.value!]));
  if (!observed.size) return null;
  return reproducesValues(points as { code: string; value: number }[], observed) ? null : { slug, base, rankingKey, year };
}

async function inspectChart(slug: string, base: string) {
  const issues: ChartAxesIssue[] = [];
  const [svg, dark, dataText, sourceText] = await Promise.all([
    blogFile(slug, `data/${base}.svg`), blogFile(slug, `data/${base}-dark.svg`),
    blogFile(slug, `data/${base}.json`), blogFile(slug, `data/${base}.source.json`),
  ]);
  const data = dataText ? JSON.parse(dataText) : null;
  const source = sourceText ? JSON.parse(sourceText) : null;
  if (!data) issues.push('no-data');
  if (!source) issues.push('no-source');
  if (!svg || !svg.includes('data-image-template="scatter"')) issues.push('not-type');
  else if (!dark) issues.push('no-dark');
  if (source && chartSourceShapeErrors(source).length) issues.push('bad-shape');
  const raw = (Array.isArray(data?.points) ? data.points : Array.isArray(data?.data) ? data.data : []) as Record<string, unknown>[];
  const points = raw.filter((p) => typeof p.x === 'number' && typeof p.y === 'number');
  if (points.some((p) => String(p.label ?? p.areaName ?? '').includes('�'))) issues.push('broken-label');
  const axes = source?.axes as { x: ChartAxisRecord; y: ChartAxisRecord } | undefined;
  if (data && source && !axes) issues.push('no-axes');
  if (axes) {
    const codes = points.map((p) => `${p.areaCode ? String(p.areaCode).slice(0, 2) : shortToCode.get(String(p.label ?? p.areaName).replace(/�/g, '')) ?? ''}000`);
    for (const axis of ['x', 'y'] as const) {
      const record = axes[axis];
      if (record.proof !== 'values' || !record.metricKey) continue;
      const rows = await valuesOf(record.metricKey);
      if (!rows || !matchScatterAxis(points.map((p) => p[axis] as number), codes, rows as never)) issues.push('axis-mismatch');
    }
  }
  return { slug, base, issues: [...new Set(issues)] };
}

async function main() {
  const slugArg = flag('--slugs');
  const slugs = slugArg ? slugArg.split(/[,\s]+/).filter(Boolean)
    : (BASE ? fs.readdirSync(BASE) : ((JSON.parse((await fetchText(`${R2}/app/blog/all.json`)) ?? '{}').articles ?? []) as { slug: string }[]).map((a) => a.slug));
  const targets: { slug: string; base: string }[] = [];
  const ranked: { slug: string; base: string }[] = [];
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < slugs.length) {
      const slug = slugs[i++];
      const md = await blogFile(slug, 'article.md');
      if (!md) continue;
      for (const base of scatterChartsOf(md)) targets.push({ slug, base });
      for (const base of rankedChartsOf(md)) ranked.push({ slug, base });
    }
  }));
  const results: Awaited<ReturnType<typeof inspectChart>>[] = [];
  let j = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (j < targets.length) {
      const t = targets[j++];
      results.push(await inspectChart(t.slug, t.base));
    }
  }));
  results.sort((a, b) => `${a.slug}/${a.base}`.localeCompare(`${b.slug}/${b.base}`));
  const stale: StaleChart[] = [];
  let k = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (k < ranked.length) {
      const t = ranked[k++];
      const found = await staleChart(t.slug, t.base);
      if (found) stale.push(found);
    }
  }));
  stale.sort((a, b) => `${a.slug}/${a.base}`.localeCompare(`${b.slug}/${b.base}`));
  const byIssue: Record<string, number> = {};
  for (const r of results) for (const issue of r.issues) byIssue[issue] = (byIssue[issue] ?? 0) + 1;
  const summary = {
    charts: results.length,
    typed: results.filter((r) => !r.issues.includes('not-type')).length,
    notTyped: byIssue['not-type'] ?? 0,
    // 値で確かめられない図の数。週次のラチェットが増加を止める
    unproved: results.filter((r) => r.issues.some((x) => x !== 'not-type' && x !== 'no-dark')).length,
    byIssue,
    rankedCharts: ranked.length,
    staleValues: stale.length,
  };
  console.log(JSON.stringify(summary));
  if (NO_WRITE) {
    for (const r of results.filter((x) => x.issues.length)) console.log(`${r.slug}/${r.base}: ${r.issues.join(' ')}`);
    for (const s of stale) console.log(`${s.slug}/${s.base}: stale-value ${s.rankingKey} ${s.year}`);
    return;
  }
  const dir = path.join(PROJECT_ROOT, datasetDir('blog.operations'));
  const items = results.filter((r) => r.issues.length);
  fs.writeFileSync(path.join(dir, 'chart-axes-queue.json'), `${JSON.stringify({ summary, items, stale }, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, 'chart-axes-LATEST.md'), [
    '# 公開中の散布図の検査', '', `表示中 ${summary.charts} 枚 / 型の画像 ${summary.typed} 枚 / 型でない ${summary.notTyped} 枚 / 値で確かめられない ${summary.unproved} 枚`, '',
    ...Object.entries(byIssue).map(([name, n]) => `- ${name}: ${n}`), '', ...items.map((r) => `- ${r.slug}/${r.base}: ${r.issues.join(' ')}`), '',
    `## 指標の今の値と違う図 (${stale.length} / ${ranked.length} 枚)`, '', ...stale.map((s) => `- ${s.slug}/${s.base}: ${s.rankingKey} ${s.year}`), '',
  ].join('\n'));
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
