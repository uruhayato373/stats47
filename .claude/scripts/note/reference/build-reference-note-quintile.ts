#!/usr/bin/env tsx
/**
 * 教材の分析企画のうち「年収によって支出がどう違うか」を問うもの (geoScopes に japan) を、
 * 家計調査の年間収入五分位階級別 (全国・二人以上の世帯・e-Stat 0003348240) から note 記事の作業コピーにする。
 * 都道府県の値で答える企画は build-reference-note.ts。執筆・検査・保存は同じ (`/expand-reference-notes`)。
 *
 *   npx tsx .claude/scripts/note/reference/build-reference-note-quintile.ts --analysis <企画ID> [--register]
 *   npx tsx .claude/scripts/note/reference/build-reference-note-quintile.ts --pending [--register]
 *
 * 企画の指標 (rankingKey) の e-Stat 品目コードを R2 の item.json から引き、同じ品目の五分位別の年間支出額を
 * 最新年と 10 年前で取る。品目コードが無い指標 (e-Stat 以外の出典) は使わず chart-data.json の skipped に理由を残す。
 * 企画が年齢階級別・月別の表を要るとき (五分位の表では答えられないとき) は止める。
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { generateBarChartSvg } from '../../../../packages/svg-builder/src/charts/index.ts';
import { R2_PUBLIC_BASE_URL } from '../../lib/site-config.cjs';
import { ESTAT_STATS_DATA_URL } from '../../lib/estat-catalog/endpoints.cjs';
import { expansionStatus, loadAnalyses, loadChannelIndex, loadExpansion } from '../../source-vault/lib/reference-expansion.mjs';
import { type Analysis, articleKeyOf, fmt, mergeWritten, registerArticle } from './build-reference-note';

const ROOT = path.resolve(__dirname, '../../../..');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const WORK_ROOT = path.join(ROOT, 'docs/31_note記事原稿');
const STATS_DATA_ID = '0003348240';
const TWO_PERSON = '03';
const CONSUMPTION = '001100000';
const HOUSEHOLD_SIZE = '000300000';
const HEAD_AGE = '000800000';
const QUINTILES = ['01', '02', '03', '04', '05'] as const;
const QUINTILE_NAMES = ['第Ⅰ階級', '第Ⅱ階級', '第Ⅲ階級', '第Ⅳ階級', '第Ⅴ階級'];
const YEARS_BACK = 10;
/** 五分位の表 (年次・全国) では答えられない企画。年齢階級別・月別の表が要る */
const NEEDS_OTHER_TABLE: Record<string, string> = {
  'kakei-marketing-2015-a04-02': '世帯主の年齢階級別の表が要る (五分位の表には年齢階級が無い)',
  'kakei-marketing-2015-a05-01': '月別の表が要る (五分位の表は年次)',
};
const ESTAT_SOURCE_URL = 'https://www.e-stat.go.jp/stat-search/database?statdisp_id=0003348240';

class Blocked extends Error {}

type Quintile = { average: number; q: number[] };
type Item = {
  key: string; code: string; label: string; unit: string;
  values: Record<string, Quintile>; ratio: Record<string, number | null>; share: Record<string, number[]>;
};

const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const register = process.argv.includes('--register');
const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

function appId() {
  const env = readFileSync(path.join(ROOT, 'apps/web/.env.development'), 'utf8');
  const m = env.match(/NEXT_PUBLIC_ESTAT_APP_ID=(\S+)/);
  if (!m) throw new Error('NEXT_PUBLIC_ESTAT_APP_ID が apps/web/.env.development に無い');
  return m[1];
}

async function estat(codes: string[], years: string[]) {
  const qs = new URLSearchParams({
    appId: appId(), statsDataId: STATS_DATA_ID, cdCat01: codes.join(','), cdCat02: TWO_PERSON,
    cdTime: years.map((y) => `${y}000000`).join(','), limit: '10000',
  });
  const res = await fetch(`${ESTAT_STATS_DATA_URL}?${qs}`);
  if (!res.ok) throw new Blocked(`e-Stat HTTP ${res.status}`);
  const json = await res.json();
  const values = json?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
  if (!values) throw new Blocked(`e-Stat: 値が無い (${JSON.stringify(json?.GET_STATS_DATA?.RESULT ?? {}).slice(0, 160)})`);
  const table = new Map<string, number>();
  for (const v of [].concat(values) as Record<string, string>[]) {
    const n = Number(v.$);
    if (Number.isFinite(n)) table.set(`${v['@cat01']}|${v['@cat03']}|${v['@time'].slice(0, 4)}`, n);
  }
  return table;
}

async function latestYear() {
  const qs = new URLSearchParams({ appId: appId(), statsDataId: STATS_DATA_ID, cdCat01: CONSUMPTION, cdCat02: TWO_PERSON, cdCat03: '00' });
  const json = await (await fetch(`${ESTAT_STATS_DATA_URL}?${qs}`)).json();
  const values = [].concat(json?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE ?? []) as Record<string, string>[];
  const year = values.map((v) => v['@time'].slice(0, 4)).sort().at(-1);
  if (!year) throw new Blocked('e-Stat: 最新年が取れない');
  return year;
}

function quintileOf(table: Map<string, number>, code: string, year: string): Quintile | null {
  const average = table.get(`${code}|00|${year}`);
  const q = QUINTILES.map((c) => table.get(`${code}|${c}|${year}`));
  if (average == null || q.some((v) => v == null)) return null;
  return { average, q: q as number[] };
}

export const isQuintileAnalysis = (a: Analysis) => a.geoScopes.includes('japan') && a.metricKeys.length > 0;

const yen = (v: number) => `${fmt(v, 0)}円`;

function itemSection(item: Item, years: string[]) {
  const [old, latest] = years;
  const now = item.values[latest];
  const lines = [
    `## ${item.label}`,
    '',
    `![${item.label}の年収五分位階級別の年間支出額](images/${item.key}-quintile.png)`,
    '',
    `${latest}年の${item.label}への年間支出額は、${QUINTILE_NAMES.map((n, i) => `${n}が${yen(now.q[i])}`).join('、')}です。` +
      (item.ratio[latest] != null ? `年収の最も高い第Ⅴ階級は、最も低い第Ⅰ階級の${fmt(item.ratio[latest]!, 2)}倍を支出しています。` : '') +
      `平均は${yen(now.average)}です。`,
  ];
  const before = item.values[old];
  if (before)
    lines.push('', `${old}年は第Ⅰ階級が${yen(before.q[0])}、第Ⅴ階級が${yen(before.q[4])}` +
      (item.ratio[old] != null ? `で、第Ⅴ階級は第Ⅰ階級の${fmt(item.ratio[old]!, 2)}倍でした。` : 'でした。'));
  if (item.share[latest])
    lines.push('', `消費支出全体に占める割合は、第Ⅰ階級が${fmt(item.share[latest][0], 2)}%、第Ⅴ階級が${fmt(item.share[latest][4], 2)}%です。`);
  return lines.join('\n');
}

function draftOf(a: Analysis, items: Item[], years: string[], household: Record<string, Quintile>) {
  const [, latest] = years;
  const size = household[`${HOUSEHOLD_SIZE}|${latest}`], age = household[`${HEAD_AGE}|${latest}`];
  const tags = [...new Set(['家計調査', '年収', '統計データ', 'stats47', ...items.slice(0, 2).map((i) => i.label)])];
  const body = [
    '<!-- WRITE:intro 問いを読者の言葉で立て、答えの要旨を2〜3段落で書く。数値は下の節と chart-data.json にあるものだけを使う -->',
    '',
    '## 年収五分位とは',
    '',
    '総務省の家計調査は、全国の二人以上の世帯を年間収入の低い順に並べて5等分し、それぞれの階級の平均的な支出を公表しています。' +
      '最も年収の低い20%の世帯が第Ⅰ階級、最も高い20%の世帯が第Ⅴ階級です。',
    '',
    size && age
      ? `${latest}年の世帯人員は第Ⅰ階級が${fmt(size.q[0], 2)}人、第Ⅴ階級が${fmt(size.q[4], 2)}人、世帯主の平均年齢は第Ⅰ階級が${fmt(age.q[0], 1)}歳、第Ⅴ階級が${fmt(age.q[4], 1)}歳です。` +
        '年収の低い階級には高齢の少人数世帯が多く、支出額の差には年収だけでなく世帯の人数と年齢の違いも含まれます。'
      : '',
    '',
    ...items.flatMap((i) => [itemSection(i, years), '']),
    '<!-- WRITE:answer 「## この問いへの答え」の見出しで、問いに対する結論を2〜4段落で書く。言えないことは言えないと書く -->',
    '',
    '## 読むときの注意',
    '',
    '- 全国の二人以上の世帯の値で、都道府県別の値ではありません。金額は物価の変化を除いていない名目の年間支出額です。',
    '- 品目は家計調査の品目分類 (2020年改定) にそろえた系列です。',
    '- 購入しなかった世帯も含めた1世帯あたりの平均なので、買った世帯の平均額より小さくなります。',
    '',
    '## データの出典',
    '',
    `- 出典：総務省統計局「家計調査」(年間収入五分位階級別、二人以上の世帯、統計表ID ${STATS_DATA_ID})（${ESTAT_SOURCE_URL}）を加工して作成`,
    ...(a.primarySources ?? []).map((s) => `- 参考：${s.organization}「${s.publicationOrDataset}」（${s.url}）`),
    '',
  ].join('\n');
  return [
    '---', 'title: "<!-- WRITE:title -->"', 'description: "<!-- WRITE:description -->"', 'status: draft', 'published: false',
    `analysis: ${a.id}`, 'tags:', ...tags.map((t) => `  - ${t}`), '---', '', body,
  ].join('\n');
}

async function renderChart(item: Item, year: string, dir: string) {
  const v = item.values[year];
  const svg = generateBarChartSvg(
    [{ label: '平均', value: v.average }, ...QUINTILE_NAMES.map((n, i) => ({ label: n, value: v.q[i] }))],
    {
      title: `${item.label}（年収五分位別）`, subtitle: `${year}年 二人以上の世帯・全国 年間支出額`,
      source: '総務省統計局「家計調査」', unit: '円', palette: 'blue', layout: 'single', showAxis: true,
      ariaLabel: `${item.label}の年収五分位階級別の年間支出額 ${year}年`,
    },
  );
  const svgPath = path.join(dir, 'images', `${item.key}-quintile.svg`);
  writeFileSync(svgPath, svg);
  execFileSync(process.execPath, ['-e',
    `require(${JSON.stringify(path.join(ROOT, '.claude/scripts/lib/svg-to-png.cjs'))}).svgToPng(process.argv[1], process.argv[2]).catch((e) => { console.error(e); process.exit(1); })`,
    svgPath, svgPath.replace(/\.svg$/, '.png')], { stdio: 'pipe' });
}

async function build(a: Analysis) {
  if (!isQuintileAnalysis(a)) throw new Blocked(`${a.id}: 年収五分位で答える企画ではない`);
  if (NEEDS_OTHER_TABLE[a.id]) throw new Blocked(`${a.id}: ${NEEDS_OTHER_TABLE[a.id]}`);
  const key = articleKeyOf(a);
  const latest = await latestYear();
  const years = [String(Number(latest) - YEARS_BACK), latest];
  const items: { key: string; code: string; label: string }[] = [];
  const skipped: { key: string; reason: string }[] = [];
  for (const k of a.metricKeys) {
    const res = await fetch(`${R2}/app/ranking/${k}/item.json`);
    if (!res.ok) { skipped.push({ key: k, reason: `item.json HTTP ${res.status}` }); continue; }
    const { item } = await res.json();
    const recipe = item.sourceConfig?.recipe;
    if (recipe?.kind !== 'kakei-chousa' || !recipe.estatParams?.cdCat01) { skipped.push({ key: k, reason: '家計調査の品目ではない' }); continue; }
    if (/quantity$/.test(k)) { skipped.push({ key: k, reason: '五分位の表は支出額だけ (購入数量は無い)' }); continue; }
    const code = recipe.estatParams.cdCat01;
    if (items.some((i) => i.code === code)) continue;
    items.push({ key: k, code, label: (item.readerLabel ?? item.title).replace(/(への支出|消費支出額?|支出額)$/, '') });
  }
  if (!items.length) throw new Blocked(`${a.id}: 五分位の表で引ける品目が無い (${skipped.map((s) => `${s.key}: ${s.reason}`).join(' / ')})`);
  const table = await estat([...new Set([...items.map((i) => i.code), CONSUMPTION, HOUSEHOLD_SIZE, HEAD_AGE])], years);
  const consumption = Object.fromEntries(years.map((y) => [y, quintileOf(table, CONSUMPTION, y)]));
  const built: Item[] = [];
  for (const i of items) {
    const values: Record<string, Quintile> = {};
    for (const y of years) { const q = quintileOf(table, i.code, y); if (q) values[y] = q; }
    if (!values[latest]) { skipped.push({ key: i.key, reason: `${latest}年の五分位の値が無い` }); continue; }
    const ratio = Object.fromEntries(Object.entries(values).map(([y, q]) => [y, q.q[0] > 0 ? round(q.q[4] / q.q[0], 2) : null]));
    const share = Object.fromEntries(Object.entries(values).filter(([y]) => consumption[y])
      .map(([y, q]) => [y, q.q.map((v, n) => round((v / consumption[y]!.q[n]) * 100, 2))]));
    built.push({ ...i, unit: '円', values, ratio, share });
  }
  const household = Object.fromEntries([HOUSEHOLD_SIZE, HEAD_AGE].flatMap((c) => years.map((y) => [`${c}|${y}`, quintileOf(table, c, y)])));
  const dir = path.join(WORK_ROOT, key);
  mkdirSync(path.join(dir, 'images'), { recursive: true });
  for (const i of built) await renderChart(i, latest, dir);
  writeFileSync(path.join(dir, 'chart-data.json'), `${JSON.stringify({
    analysisId: a.id, question: a.question, kind: 'quintile', generatedAt: new Date().toISOString(), years,
    consumption, household, items: built, skipped,
  }, null, 2)}\n`);
  writeFileSync(path.join(dir, 'data-provenance.json'), `${JSON.stringify({
    analysisId: a.id,
    inputs: built.map((i) => ({ rankingKey: i.key, estat: { statsDataId: STATS_DATA_ID, cdCat01: i.code, cdCat02: TWO_PERSON, years } })),
    skipped, primarySources: a.primarySources ?? [],
    restore: `npx tsx .claude/scripts/note/reference/build-reference-note-quintile.ts --analysis ${a.id}`,
    images: built.map((i) => ({ file: `images/${i.key}-quintile.png`, generator: 'packages/svg-builder generateBarChartSvg', year: latest })),
  }, null, 2)}\n`);
  {
    const draftPath = path.join(dir, 'draft.md'), fresh = draftOf(a, built, years, household as Record<string, Quintile>);
    writeFileSync(draftPath, existsSync(draftPath) ? mergeWritten(readFileSync(draftPath, 'utf8'), fresh) : fresh);
  }
  if (register) registerArticle(a, key, 's47-kakei-reading', []);
  return { key, items: built.map((i) => i.key), skipped: skipped.length };
}

async function main() {
  const analyses: Analysis[] = loadAnalyses();
  let targets: Analysis[];
  if (arg('--analysis')) {
    const a = analyses.find((x) => x.id === arg('--analysis'));
    if (!a) throw new Error(`企画が無い: ${arg('--analysis')}`);
    targets = [a];
  } else if (process.argv.includes('--pending')) {
    targets = expansionStatus(analyses, loadExpansion(), loadChannelIndex())
      .filter((r: { channel: string; state: string }) => r.channel === 'note' && r.state === 'pending')
      .map((r: { analysis: Analysis }) => r.analysis).filter(isQuintileAnalysis);
  } else {
    console.error('使い方: --analysis <企画ID> | --pending  [--register]');
    process.exit(2);
  }
  let failed = 0;
  for (const a of targets) {
    try {
      const out = await build(a);
      console.log(`✓ ${a.id} → ${out.key} (${out.items.join(', ')}${out.skipped ? `、使わない指標 ${out.skipped} 件` : ''})`);
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
