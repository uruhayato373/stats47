#!/usr/bin/env tsx
/**
 * 教材 (参考文献) の分析企画 1 件から、note 記事の作業コピー一式を R2 の観測値だけで決定的に作る。
 * 規約: .claude/rules/reference-source-standards.md「分析企画の展開」・.claude/scripts/note/catalog/README.md
 *
 *   npx tsx .claude/scripts/note/reference/build-reference-note.ts --analysis <企画ID> [--register]
 *   npx tsx .claude/scripts/note/reference/build-reference-note.ts --pending [--register]   # note が未着手の都道府県企画をすべて
 *   npx tsx .claude/scripts/note/reference/build-reference-note.ts --refresh [--register]   # 企画中も含めて作り直す (執筆済みの本文・既存の画像は残す)
 *
 * 出力: docs/31_note記事原稿/<key>/ (gitignore された作業場)
 *   chart-data.json       指標ごとの 47 都道府県の値・順位・要約、指標間の順位相関、地方別平均
 *   data-provenance.json  R2 の入力キー・年・e-Stat 等の出典・企画の一次資料
 *   draft.md              数値・図・出典・注意の節は決定的に書く。題名・導入・問いへの答えは <!-- WRITE:… --> を執筆者が埋める
 *   images/<rankingKey>.png  全 47 都道府県のタイル地図 (quick-still.ts)
 * --register: 記事台帳に下書き (status draft・本文未保存) を足し、展開記録に企画中 (planned) を書く。
 *
 * 対象は都道府県の値で答えられる企画 (geoScopes に japan を含まず、metricKeys がある)。書籍の本文・数値・図は使わない。
 * 指標が R2 に無い・47 都道府県がそろう年が無いときは、その企画を止めて理由を出す (推測で埋めない)。
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PREF_CAPITAL_COORDS } from '../../../../packages/migration-flow/src/lib/pref-capitals';
import { R2_PUBLIC_BASE_URL } from '../../lib/site-config.cjs';
import {
  type ExpansionRecord, type ReferenceAnalysis, checkRecord, expansionStatus, loadAnalyses, loadChannelIndex, loadExpansion, validateExpansion,
} from '../../source-vault/lib/reference-expansion.mjs';
import { readArticleLedger, updateArticleLedger } from '../lib/article-ledger.mjs';
import { qualifyLabel } from './lib/estat-denominator';
import { datasetPath } from '../../../../config/datasets.mjs';

const ROOT = path.resolve(__dirname, '../../../..');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const WORK_ROOT = path.join(ROOT, 'docs/31_note記事原稿');
const SOURCE_CODES: Record<string, string> = {
  'average-income-ranking': 'inc',
  'gis-business-guide': 'gis',
  'kakei-marketing': 'kakei',
  'money-health-ranking': 'mh',
  'prefecture-deviation': 'dev',
  'prefecture-ranking-consumption': 'prc',
};
const CATEGORY_MAGAZINES: Record<string, string> = {
  population: 's47-population', educationsports: 's47-education', socialsecurity: 's47-health',
  landweather: 's47-climate', agriculture: 's47-agriculture', safetyenvironment: 's47-safety',
  laborwage: 's47-labor', tourism: 's47-tourism', miningindustry: 's47-industry', commercial: 's47-industry',
  construction: 's47-housing', infrastructure: 's47-infrastructure', ict: 's47-ict', international: 's47-international',
  energy: 's47-energy', administrativefinancial: 's47-fiscal', economy: 's47-economy',
};
const REGIONS: [string, number, number][] = [
  ['北海道', 1, 1], ['東北', 2, 7], ['関東', 8, 14], ['中部', 15, 23], ['近畿', 24, 30], ['中国', 31, 35], ['四国', 36, 39], ['九州・沖縄', 40, 47],
];
const KAKEI_SURVEY = 'kakei-chousa';
const SOCIAL_LIFE_SURVEY = 'social-life-basic-survey';
/** 地域差を論じられる最小の都道府県数 */
const MIN_AREAS = 10;

export type Analysis = ReferenceAnalysis;
type Item = {
  rankingKey: string; rankingName?: string; title: string; readerLabel?: string; subtitle?: string; unit: string;
  categoryKey: string; surveyIds?: string[]; valueDisplay?: { decimalPlaces?: number };
  sourceConfig?: { source?: { name?: string; url?: string }; recipe?: { kind?: string; estatParams?: { statsDataId?: string; cdCat01?: string } } };
};
type Row = { areaCode: string; areaName: string; yearCode: string | number; value: number };
type Ranked = { rank: number; areaCode: string; areaName: string; value: number };
type Metric = {
  key: string; name: string; label: string; subtitle: string; unit: string; year: string; decimals: number;
  categoryKey: string; surveyIds: string[]; source: { name: string; url: string } | null; capitalCity: boolean;
  rows: Ranked[]; summary: { mean: number; max: number; min: number; ratio: number | null; count: number };
  regions: { region: string; mean: number }[];
};

class Blocked extends Error {}

const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const register = process.argv.includes('--register');

export const articleKeyOf = (a: Pick<Analysis, 'sourceKey' | 'id'>) => {
  const code = SOURCE_CODES[a.sourceKey];
  if (!code) throw new Blocked(`${a.id}: 記事キーの略号が無い資料 (${a.sourceKey})`);
  return `b-ref-${code}-${a.id.replace(/^.*?-(?:unknown|\d{4})-/, '')}`;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Blocked(`${url}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;
export const fmt = (v: number, decimals: number) =>
  v.toLocaleString('ja-JP', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** 同じ値は同じ順位 (小さい方にそろえる)。値の大きい順 */
export function rankRows(rows: Row[]): Ranked[] {
  const sorted = [...rows].sort((a, b) => b.value - a.value || a.areaCode.localeCompare(b.areaCode));
  return sorted.map((r) => ({
    rank: sorted.findIndex((s) => s.value === r.value) + 1, areaCode: r.areaCode, areaName: r.areaName, value: r.value,
  }));
}

function regionOf(areaCode: string) {
  const n = Number(areaCode.slice(0, 2));
  return REGIONS.find(([, lo, hi]) => n >= lo && n <= hi)?.[0] ?? '不明';
}

/** 順位相関 (Spearman・同順位は平均順位)。共通する都道府県だけで計算する */
export function spearman(a: Ranked[], b: Ranked[]): { rho: number; n: number } {
  const bv = new Map(b.map((r) => [r.areaCode, r.value]));
  const pairs = a.filter((r) => bv.has(r.areaCode)).map((r) => [r.value, bv.get(r.areaCode)!] as const);
  const ranks = (vals: number[]) => {
    const order = vals.map((v, i) => [v, i] as const).sort((x, y) => y[0] - x[0]);
    const out = new Array<number>(vals.length);
    for (let i = 0; i < order.length; ) {
      let j = i;
      while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
      for (let k = i; k <= j; k++) out[order[k][1]] = (i + j) / 2 + 1;
      i = j + 1;
    }
    return out;
  };
  const ra = ranks(pairs.map((p) => p[0]));
  const rb = ranks(pairs.map((p) => p[1]));
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const ma = mean(ra), mb = mean(rb);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < ra.length; i++) {
    num += (ra[i] - ma) * (rb[i] - mb); da += (ra[i] - ma) ** 2; db += (rb[i] - mb) ** 2;
  }
  return { rho: da && db ? round(num / Math.sqrt(da * db), 2) : 0, n: pairs.length };
}

async function loadMetric(key: string): Promise<Metric> {
  const { item } = await fetchJson<{ item: Item & { isActive?: boolean } }>(`${R2}/app/ranking/${key}/item.json`);
  const { rows } = await fetchJson<{ rows: Row[] }>(`${R2}/app/stats/${key}/values.json`);
  const byYear = new Map<string, Row[]>();
  for (const r of rows) {
    if (!/^\d{2}000$/.test(r.areaCode) || r.areaCode === '00000' || !Number.isFinite(r.value)) continue;
    const y = String(r.yearCode);
    byYear.set(y, [...(byYear.get(y) ?? []), r]);
  }
  // 47 都道府県がそろう最新年。産地のある県だけの指標などで 47 がそろわなければ、県の数が最も多い年のうち最新年
  const full = [...byYear.keys()].filter((y) => byYear.get(y)!.length === 47).sort().at(-1);
  const most = Math.max(0, ...[...byYear.values()].map((r) => r.length));
  const year = full ?? [...byYear.keys()].filter((y) => byYear.get(y)!.length === most).sort().at(-1);
  if (!year || most < MIN_AREAS) throw new Blocked(`${key}: 都道府県の値が${MIN_AREAS}未満`);
  const ranked = rankRows(byYear.get(year)!);
  const values = ranked.map((r) => r.value);
  const max = values[0], min = values.at(-1)!;
  // 値がすべて整数なら小数を付けない (人数などに「.0」を付けない)。小数を含むときは配信の桁数に合わせる
  const decimals = values.every(Number.isInteger) ? 0 : (item.valueDisplay?.decimalPlaces ?? 1);
  const regions = REGIONS.map(([region]) => {
    const vs = ranked.filter((r) => regionOf(r.areaCode) === region).map((r) => r.value);
    return vs.length ? { region, mean: round(vs.reduce((s, v) => s + v, 0) / vs.length, decimals + 1) } : null;
  }).filter((r): r is { region: string; mean: number } => r !== null).sort((a, b) => b.mean - a.mean);
  const recipe = item.sourceConfig?.recipe;
  return {
    key, name: await qualifyLabel(item.rankingName ?? item.title, recipe), label: await qualifyLabel(item.readerLabel ?? item.title, recipe),
    subtitle: item.subtitle ?? '',
    unit: item.unit ?? '', year, decimals, categoryKey: item.categoryKey, surveyIds: item.surveyIds ?? [],
    capitalCity: /県庁所在市/.test(item.subtitle ?? ''),
    source: item.sourceConfig?.source?.name ? { name: item.sourceConfig.source.name, url: item.sourceConfig.source.url ?? '' } : null,
    rows: ranked,
    summary: {
      mean: round(values.reduce((s, v) => s + v, 0) / values.length, decimals + 1), max, min,
      ratio: min > 0 ? round(max / min, 2) : null, count: values.length,
    },
    regions,
  };
}

function magazineOf(metrics: Metric[]) {
  if (metrics.every((m) => m.surveyIds.includes(KAKEI_SURVEY))) return 's47-kakei-reading';
  if (metrics.some((m) => m.surveyIds.includes(SOCIAL_LIFE_SURVEY)) && metrics.every((m) => m.categoryKey === 'educationsports'))
    return 's47-sports-culture';
  const count = new Map<string, number>();
  for (const m of metrics) count.set(m.categoryKey, (count.get(m.categoryKey) ?? 0) + 1);
  const top = [...count].sort((a, b) => b[1] - a[1])[0][0];
  return CATEGORY_MAGAZINES[top] ?? 's47-economy';
}

const withUnit = (m: Metric, v: number) => `${fmt(v, m.decimals)}${m.unit}`;
/** 県庁所在市の値 (家計調査など) は、県名に市名を添えて県全体の値と読まれないようにする */
export const areaLabel = (m: Pick<Metric, 'capitalCity'>, r: Pick<Ranked, 'areaCode' | 'areaName'>) =>
  m.capitalCity ? `${r.areaName}(${r.areaCode === '13000' ? '東京都区部' : PREF_CAPITAL_COORDS[r.areaCode.slice(0, 2)].name})` : r.areaName;

function metricSection(m: Metric) {
  const top = m.rows.slice(0, 3), bottom = m.rows.slice(-3).reverse();
  const unitWord = m.capitalCity ? '市' : '県';
  const lines = [
    `## ${m.label} (${m.year}年)`,
    '',
    ...(m.summary.count === 47 ? [`![${m.label}の47都道府県タイル地図](images/${m.key}.png)`, ''] : []),
    `${m.label}が最も多いのは${areaLabel(m, top[0])}の${withUnit(m, top[0].value)}で、2位は${areaLabel(m, top[1])}の${withUnit(m, top[1].value)}、3位は${areaLabel(m, top[2])}の${withUnit(m, top[2].value)}と続きます。` +
      `最も少ないのは${areaLabel(m, bottom[0])}の${withUnit(m, bottom[0].value)}です。` +
      (m.summary.ratio ? `最も多い${unitWord}は最も少ない${unitWord}の${fmt(m.summary.ratio, 2)}倍で、` : '') +
      `${m.summary.count === 47 ? '47都道府県' : `値のある${m.summary.count}都道府県`}の単純平均は${withUnit(m, m.summary.mean)}です。`,
    '',
    `地方別の平均では${m.regions[0].region}(${withUnit(m, m.regions[0].mean)})が最も高く、${m.regions.at(-1)!.region}(${withUnit(m, m.regions.at(-1)!.mean)})が最も低くなります。` +
      `47都道府県の順位は[stats47の${m.label}ランキング](https://stats47.jp/ranking/${m.key})で確認できます。`,
  ];
  if (m.subtitle) lines.push('', `この指標は「${m.subtitle}」です。`);
  if (m.summary.count < 47) lines.push('', `${m.year}年に値があるのは${m.summary.count}都道府県で、値の無い県は順位の対象外です。`);
  return lines.join('\n');
}

function relationSection(metrics: Metric[]) {
  if (metrics.length < 2) return null;
  const pairs: string[] = [];
  for (let i = 0; i < metrics.length; i++)
    for (let j = i + 1; j < metrics.length; j++) {
      const { rho } = spearman(metrics[i].rows, metrics[j].rows);
      const strength = Math.abs(rho) >= 0.7 ? '強い' : Math.abs(rho) >= 0.4 ? 'ある程度の' : 'ほとんど';
      const dir = Math.abs(rho) < 0.4 ? '関係は見られません' : rho > 0 ? '正の関係があります' : '負の関係があります';
      pairs.push(`- ${metrics[i].label}と${metrics[j].label}: 順位相関係数${fmt(rho, 2)}で、${strength}${dir}`);
    }
  const topCount = new Map<string, number>();
  const bottomCount = new Map<string, number>();
  for (const m of metrics) {
    for (const r of m.rows.filter((r) => r.rank <= 10)) topCount.set(r.areaName, (topCount.get(r.areaName) ?? 0) + 1);
    for (const r of m.rows.filter((r) => r.rank >= 38)) bottomCount.set(r.areaName, (bottomCount.get(r.areaName) ?? 0) + 1);
  }
  // 「半数以上」は 2 指標以上に入る県に限る (2 指標のときに 1 指標だけの県を並べない)
  const half = Math.max(2, Math.ceil(metrics.length / 2));
  const often = (c: Map<string, number>) => [...c].filter(([, n]) => n >= half).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a}(${n}指標)`);
  const highs = often(topCount), lows = often(bottomCount);
  return [
    '## 指標どうしの関係',
    '',
    `順位相関係数は、2つの指標の都道府県の並び順がどれだけ似ているかを-1から1で表します。1に近いほど同じ県が上位に、-1に近いほど逆の県が上位に来ます。`,
    '',
    ...pairs,
    '',
    highs.length ? `${metrics.length}指標のうち半数以上で上位10位に入るのは${highs.join('、')}です。` : `${metrics.length}指標の半数以上で上位10位に入る県はありません。`,
    lows.length ? `半数以上で下位10位(38位以下)に入るのは${lows.join('、')}です。` : `半数以上で下位10位(38位以下)に入る県はありません。`,
  ].join('\n');
}

function cautionSection(metrics: Metric[], skipped: { key: string; reason: string }[]) {
  const years = [...new Set(metrics.map((m) => m.year))];
  const lines = ['## 読むときの注意', ''];
  if (years.length > 1) lines.push(`- 指標ごとに最新の年が異なります (${metrics.map((m) => `${m.label}は${m.year}年`).join('、')})。`);
  if (metrics.some((m) => m.surveyIds.includes(KAKEI_SURVEY)))
    lines.push('- 家計調査の値は、県全体ではなく都道府県庁所在市の二人以上の世帯の値です。標本が小さく、年ごとの振れが大きい品目があります。');
  if (metrics.length > 1) lines.push('- 指標どうしの関係は同じ時点の都道府県の並びを比べたもので、因果関係を示すものではありません。');
  lines.push('- 順位は値の大きい順で、同じ値の県には同じ順位を付けています。地方別の平均は都道府県の値の単純平均です。');
  if (skipped.length) lines.push(`- この問いに関係する指標のうち${skipped.length}件は、stats47 に47都道府県の値がそろっていないため使っていません。`);
  return lines.join('\n');
}

function sourceSection(a: Analysis, metrics: Metric[]) {
  const seen = new Set<string>();
  const lines = ['## データの出典', ''];
  for (const m of metrics) {
    if (!m.source || seen.has(m.source.name)) continue;
    seen.add(m.source.name);
    lines.push(`- 出典：「${m.source.name}」${m.source.url ? `（${m.source.url}）` : ''}を加工して作成`);
  }
  for (const s of a.primarySources ?? []) {
    const label = `${s.organization}「${s.publicationOrDataset}」`;
    if (seen.has(label)) continue;
    seen.add(label);
    lines.push(`- 参考：${label}（${s.url}）`);
  }
  lines.push('', `各指標の値は stats47 のランキングページ (${metrics.map((m) => `[${m.label}](https://stats47.jp/ranking/${m.key})`).join('・')}) から取得しました。`);
  return lines.join('\n');
}

function draftOf(a: Analysis, metrics: Metric[], skipped: { key: string; reason: string }[]) {
  const tags = [...new Set(['都道府県', '統計データ', 'stats47', ...metrics.slice(0, 3).map((m) => m.label)])];
  const body = [
    '<!-- WRITE:intro 問いを読者の言葉で立て、答えの要旨を2〜3段落で書く。数値は下の節と chart-data.json にあるものだけを使う -->',
    '',
    ...metrics.map(metricSection).flatMap((s) => [s, '']),
    ...(relationSection(metrics) ? [relationSection(metrics)!, ''] : []),
    '<!-- WRITE:answer 「## この問いへの答え」の見出しで、問いに対する結論を2〜4段落で書く。言えないことは言えないと書く -->',
    '',
    cautionSection(metrics, skipped),
    '',
    sourceSection(a, metrics),
    '',
  ].join('\n');
  return [
    '---',
    'title: "<!-- WRITE:title -->"',
    'description: "<!-- WRITE:description -->"',
    'status: draft',
    'published: false',
    `analysis: ${a.id}`,
    'tags:',
    ...tags.map((t) => `  - ${t}`),
    '---',
    '',
    body,
  ].join('\n');
}

/** 執筆済みの下書きから書いた部分 (題名・説明文・最初の見出しより前の導入・「この問いへの答え」の節) を取り出し、新しい生成結果へ入れる */
export function mergeWritten(old: string, fresh: string): string {
  if (old.includes('<!-- WRITE:intro')) return fresh;
  const field = (name: string) => old.match(new RegExp(`^${name}: "(.*)"$`, 'm'))?.[1];
  const body = old.replace(/^---\n[\s\S]*?\n---\n/, '');
  const intro = body.slice(0, body.search(/^## /m)).trim();
  const answer = body.match(/^## この問いへの答え\n[\s\S]*?(?=^## 読むときの注意)/m)?.[0].trim();
  if (!field('title') || !intro || !answer) throw new Blocked('執筆済みの下書きから題名・導入・答えを取り出せない (手で直してから作り直す)');
  return fresh
    .replace('<!-- WRITE:title -->', field('title')!)
    .replace('<!-- WRITE:description -->', field('description') ?? '')
    .replace(/<!-- WRITE:intro[^>]*-->/, () => intro)
    .replace(/<!-- WRITE:answer[^>]*-->/, () => answer);
}

function renderImage(m: Metric, imagesDir: string) {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'ref-note-'));
  try {
    execFileSync(process.execPath, ['--import', 'tsx', path.join(ROOT, '.claude/scripts/sns/quick-still.ts'),
      '--key', m.key, '--year', m.year, '--out', tmp, '--require-png'], { cwd: ROOT, stdio: 'pipe' });
    copyFileSync(path.join(tmp, 'stills', `${m.key}.png`), path.join(imagesDir, `${m.key}.png`));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export function isPrefectureAnalysis(a: Analysis) {
  return a.metricKeys.length > 0 && a.geoScopes.includes('prefecture-set') && !a.geoScopes.includes('japan');
}

async function build(a: Analysis) {
  if (!isPrefectureAnalysis(a)) throw new Blocked(`${a.id}: 都道府県の値で答える企画ではない (geoScopes=${a.geoScopes.join(',')})`);
  const key = articleKeyOf(a);
  const metrics: Metric[] = [];
  const skipped: { key: string; reason: string }[] = [];
  for (const k of a.metricKeys) {
    try {
      metrics.push(await loadMetric(k));
    } catch (error) {
      if (!(error instanceof Blocked)) throw error;
      skipped.push({ key: k, reason: (error as Error).message });
    }
  }
  if (!metrics.length) throw new Blocked(`使える指標が無い: ${skipped.map((s) => s.reason).join(' / ')}`);
  // 同じ表示名の指標 (部活動の種目・男女別など) は subtitle を添えて見分けられるようにする
  const shared = new Set(metrics.map((m) => m.label).filter((l, i, all) => all.indexOf(l) !== i));
  for (const m of metrics) if (m.subtitle && shared.has(m.label)) m.label = `${m.label}（${m.subtitle}）`;
  const dir = path.join(WORK_ROOT, key);
  const imagesDir = path.join(dir, 'images');
  mkdirSync(imagesDir, { recursive: true });
  // 全 47 県タイル地図は 47 都道府県がそろう指標だけ (quick-still.ts が欠測を拒む)
  for (const m of metrics) if (m.summary.count === 47 && !existsSync(path.join(imagesDir, `${m.key}.png`))) renderImage(m, imagesDir);
  const correlations = metrics.flatMap((m, i) => metrics.slice(i + 1).map((n) => ({ a: m.key, b: n.key, ...spearman(m.rows, n.rows) })));
  writeFileSync(path.join(dir, 'chart-data.json'), `${JSON.stringify({
    analysisId: a.id, question: a.question, generatedAt: new Date().toISOString(),
    metrics: metrics.map(({ surveyIds, categoryKey, ...m }) => m), correlations, skipped,
  }, null, 2)}\n`);
  writeFileSync(path.join(dir, 'data-provenance.json'), `${JSON.stringify({
    analysisId: a.id,
    inputs: metrics.map((m) => ({ rankingKey: m.key, year: m.year, r2: [`app/ranking/${m.key}/item.json`, `app/stats/${m.key}/values.json`], source: m.source })),
    primarySources: a.primarySources ?? [],
    restore: `npx tsx .claude/scripts/note/reference/build-reference-note.ts --analysis ${a.id}`,
    images: metrics.filter((m) => m.summary.count === 47).map((m) => ({ file: `images/${m.key}.png`, generator: '.claude/scripts/sns/quick-still.ts', rankingKey: m.key, year: m.year })),
  }, null, 2)}\n`);
  const draftPath = path.join(dir, 'draft.md');
  // 執筆済みの下書きは、書いた題名・説明文・導入・答えを残して生成部分だけ作り直す
  const fresh = draftOf(a, metrics, skipped);
  writeFileSync(draftPath, existsSync(draftPath) ? mergeWritten(readFileSync(draftPath, 'utf8'), fresh) : fresh);
  if (register) registerArticle(a, key, magazineOf(metrics), metrics.map((m) => `/ranking/${m.key}`));
  return { key, metrics: metrics.map((m) => `${m.key}@${m.year}`) };
}

/** 記事台帳に下書きを足し、展開記録に企画中 (planned) を書く。どちらも既にあれば何もしない */
export function registerArticle(a: Analysis, key: string, magazine: string, stats47Targets: string[]) {
  updateArticleLedger((ledger: { articles: Record<string, unknown>[] }) => {
    if (ledger.articles.some((x) => x.key === key)) return;
    ledger.articles.push({
      key, vertical: 'stats47-note', series: 'B', title: a.question, magazine, isPaid: false,
      status: 'draft', r2Path: `note/stats47-note/${key}`, body: { store: 'r2-public', manifest: null },
      stats47Targets,
    });
  });
  const file = path.join(ROOT, datasetPath('source-inventory.expansion'));
  const ledger = loadExpansion();
  if (ledger.records.some((r: { analysis: string; channel: string }) => r.analysis === a.id && r.channel === 'note')) return;
  const record: ExpansionRecord = { analysis: a.id, channel: 'note', status: 'planned', target: `note:${key}`, decidedAt: new Date().toISOString().slice(0, 10), decidedBy: 'note-manager' };
  const next = { ...ledger, records: [...ledger.records, record] };
  const index = loadChannelIndex();
  const errors = [...checkRecord(record, a, index), ...validateExpansion(next, loadAnalyses(), index)];
  if (errors.length) throw new Blocked(`展開記録に書けない: ${errors.join(' / ')}`);
  next.records.sort((x: { analysis: string; channel: string; target?: string }, y: typeof x) =>
    (x.analysis + x.channel + (x.target ?? '') < y.analysis + y.channel + (y.target ?? '') ? -1 : 1));
  writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
}

async function main() {
  const analyses: Analysis[] = loadAnalyses();
  let targets: Analysis[];
  if (arg('--analysis')) {
    const a = analyses.find((x) => x.id === arg('--analysis'));
    if (!a) throw new Error(`企画が無い: ${arg('--analysis')}`);
    targets = [a];
  } else if (process.argv.includes('--pending') || process.argv.includes('--refresh')) {
    // --refresh は企画中 (下書き登録済み) も含めて作り直す。書いた本文は上書きしない
    const states = process.argv.includes('--refresh') ? ['pending', 'planned'] : ['pending'];
    targets = expansionStatus(analyses, loadExpansion(), loadChannelIndex())
      .filter((r: { channel: string; state: string }) => r.channel === 'note' && states.includes(r.state))
      .map((r: { analysis: Analysis }) => r.analysis)
      .filter(isPrefectureAnalysis);
  } else {
    console.error('使い方: --analysis <企画ID> | --pending  [--register]');
    process.exit(2);
  }
  readArticleLedger();
  let failed = 0;
  for (const a of targets) {
    try {
      const out = await build(a);
      console.log(`✓ ${a.id} → ${out.key} (${out.metrics.join(', ')})`);
    } catch (error) {
      failed++;
      console.error(`✗ ${a.id}: ${(error as Error).message}`);
      if (!(error instanceof Blocked)) throw error;
    }
  }
  console.log(`${targets.length - failed} / ${targets.length} 件を作成`);
  if (failed) process.exitCode = 1;
}

if (require.main === module) main();
