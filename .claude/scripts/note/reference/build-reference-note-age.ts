#!/usr/bin/env tsx
/**
 * 教材の分析企画のうち「世帯主の年齢によって家計がどう違うか」を問うもの (kakei-marketing a04-02) を、
 * 家計調査の世帯主の年齢階級別 (全国・二人以上の世帯・e-Stat 金額 0003348238 / 数量 0003348237) から
 * note 記事の作業コピーにする。エンゲル係数 (食料 ÷ 消費支出) と、品目の購入単価 (金額 ÷ 数量) を年齢階級ごとに出す。
 * 執筆・検査・保存は `/expand-reference-notes`。
 *
 *   npx tsx .claude/scripts/note/reference/build-reference-note-age.ts --analysis <企画ID> [--register]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { generateBarChartSvg } from '../../../../packages/svg-builder/src/charts/index.ts';
import { R2_PUBLIC_BASE_URL } from '../../lib/site-config.cjs';
import { ESTAT_STATS_DATA_URL } from '../../lib/estat-catalog/endpoints.cjs';
import { loadAnalyses } from '../../source-vault/lib/reference-expansion.mjs';
import { type Analysis, articleKeyOf, fmt, registerArticle } from './build-reference-note';

const ROOT = path.resolve(__dirname, '../../../..');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const WORK_ROOT = path.join(ROOT, 'docs/31_note記事原稿');
const AMOUNT_TABLE = '0003348238';
const QUANTITY_TABLE = '0003348237';
const TWO_PERSON = '03';
const FOOD = '010000000';
const CONSUMPTION = '001100000';
const AGES: [string, string][] = [['430', '29歳以下'], ['303', '30〜39歳'], ['304', '40〜49歳'], ['305', '50〜59歳'], ['306', '60〜69歳'], ['570', '70歳以上']];
/** 数量の単位 (家計調査の品目の数量単位) */
const QUANTITY_UNITS: Record<string, string> = { '010110001': 'kg', '011020010': 'g' };
const SUPPORTED = new Set(['kakei-marketing-2015-a04-02']);
const SOURCE_URL = 'https://www.e-stat.go.jp/stat-search/database?statdisp_id=0003348238';

const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

function appId() {
  const m = readFileSync(path.join(ROOT, 'apps/web/.env.development'), 'utf8').match(/NEXT_PUBLIC_ESTAT_APP_ID=(\S+)/);
  if (!m) throw new Error('NEXT_PUBLIC_ESTAT_APP_ID が apps/web/.env.development に無い');
  return m[1];
}

async function estat(table: string, codes: string[], year: string) {
  const qs = new URLSearchParams({ appId: appId(), statsDataId: table, cdCat01: codes.join(','), cdCat02: TWO_PERSON,
    cdCat03: AGES.map(([c]) => c).join(','), cdTime: `${year}000000`, limit: '1000' });
  const json = await (await fetch(`${ESTAT_STATS_DATA_URL}?${qs}`)).json();
  const values = json?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
  if (!values) throw new Error(`e-Stat ${table}: 値が無い`);
  const out = new Map<string, number>();
  for (const v of [].concat(values) as Record<string, string>[]) if (Number.isFinite(Number(v.$))) out.set(`${v['@cat01']}|${v['@cat03']}`, Number(v.$));
  return out;
}

async function latestYear() {
  const qs = new URLSearchParams({ appId: appId(), statsDataId: AMOUNT_TABLE, cdCat01: CONSUMPTION, cdCat02: TWO_PERSON, cdCat03: 'A00' });
  const json = await (await fetch(`${ESTAT_STATS_DATA_URL}?${qs}`)).json();
  return ([].concat(json?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE ?? []) as Record<string, string>[])
    .map((v) => v['@time'].slice(0, 4)).sort().at(-1)!;
}

function chart(dir: string, file: string, title: string, unit: string, values: number[], year: string) {
  const svg = generateBarChartSvg(AGES.map(([, n], i) => ({ label: n, value: values[i] })), {
    title, subtitle: `${year}年 二人以上の世帯・全国 世帯主の年齢階級別`, source: '総務省統計局「家計調査」', unit,
    palette: 'blue', layout: 'single', showAxis: true, ariaLabel: `${title} ${year}年`,
  });
  const svgPath = path.join(dir, 'images', `${file}.svg`);
  writeFileSync(svgPath, svg);
  execFileSync(process.execPath, ['-e',
    `require(${JSON.stringify(path.join(ROOT, '.claude/scripts/lib/svg-to-png.cjs'))}).svgToPng(process.argv[1], process.argv[2]).catch((e) => { console.error(e); process.exit(1); })`,
    svgPath, svgPath.replace(/\.svg$/, '.png')], { stdio: 'pipe' });
}

async function build(a: Analysis) {
  if (!SUPPORTED.has(a.id)) throw new Error(`${a.id}: 年齢階級別の生成器の対象ではない`);
  const year = await latestYear();
  const items: { key: string; code: string; label: string }[] = [];
  for (const k of a.metricKeys) {
    const res = await fetch(`${R2}/app/ranking/${k}/item.json`);
    if (!res.ok) continue;
    const { item } = await res.json();
    const code = item.sourceConfig?.recipe?.kind === 'kakei-chousa' ? item.sourceConfig.recipe.estatParams?.cdCat01 : null;
    if (code && QUANTITY_UNITS[code]) items.push({ key: k, code, label: (item.readerLabel ?? item.title).replace(/(への支出|消費支出額?|支出額)$/, '') });
  }
  const amount = await estat(AMOUNT_TABLE, [FOOD, CONSUMPTION, ...items.map((i) => i.code)], year);
  const quantity = await estat(QUANTITY_TABLE, items.map((i) => i.code), year);
  const at = (m: Map<string, number>, code: string) => AGES.map(([c]) => m.get(`${code}|${c}`) ?? NaN);
  const food = at(amount, FOOD), consumption = at(amount, CONSUMPTION);
  const engel = food.map((f, i) => round((f / consumption[i]) * 100, 1));
  const built = items.map((i) => {
    const amt = at(amount, i.code), qty = at(quantity, i.code);
    const perUnit = QUANTITY_UNITS[i.code] === 'g' ? 100 : 1;
    return { ...i, amount: amt, quantity: qty, quantityUnit: QUANTITY_UNITS[i.code],
      price: amt.map((v, n) => round((v / qty[n]) * perUnit, 0)), priceUnit: `円/${perUnit === 100 ? '100g' : QUANTITY_UNITS[i.code]}` };
  });
  if ([...engel, ...built.flatMap((b) => b.price)].some((v) => !Number.isFinite(v))) throw new Error('e-Stat の値に欠けがある');
  const key = articleKeyOf(a);
  const dir = path.join(WORK_ROOT, key);
  mkdirSync(path.join(dir, 'images'), { recursive: true });
  chart(dir, 'engel-coefficient-age', 'エンゲル係数（食料÷消費支出）', '%', engel, year);
  for (const b of built) chart(dir, `${b.key}-price-age`, `${b.label}の購入単価`, b.priceUnit, b.price, year);
  writeFileSync(path.join(dir, 'chart-data.json'), `${JSON.stringify({
    analysisId: a.id, question: a.question, kind: 'age', year, ages: AGES.map(([, n]) => n),
    food, consumption, engel, items: built, generatedAt: new Date().toISOString(),
  }, null, 2)}\n`);
  writeFileSync(path.join(dir, 'data-provenance.json'), `${JSON.stringify({
    analysisId: a.id, estat: { amount: AMOUNT_TABLE, quantity: QUANTITY_TABLE, cdCat02: TWO_PERSON, year, codes: [FOOD, CONSUMPTION, ...built.map((b) => b.code)] },
    primarySources: a.primarySources ?? [], restore: `npx tsx .claude/scripts/note/reference/build-reference-note-age.ts --analysis ${a.id}`,
  }, null, 2)}\n`);
  const list = (vals: number[], unit: string, d = 0) => AGES.map(([, n], i) => `${n}が${fmt(vals[i], d)}${unit}`).join('、');
  const body = [
    '<!-- WRITE:intro 問いを読者の言葉で立て、答えの要旨を2〜3段落で書く。数値は下の節と chart-data.json にあるものだけを使う -->',
    '',
    '## エンゲル係数を年齢で比べる',
    '',
    '![世帯主の年齢階級別のエンゲル係数](images/engel-coefficient-age.png)',
    '',
    `エンゲル係数は、消費支出に占める食料費の割合です。${year}年の二人以上の世帯で世帯主の年齢別に見ると、${list(engel, '%', 1)}です。`,
    '',
    ...built.flatMap((b) => [
      `## ${b.label}の購入単価`,
      '',
      `![${b.label}の世帯主の年齢階級別の購入単価](images/${b.key}-price-age.png)`,
      '',
      `${b.label}の年間支出額を購入数量で割った購入単価は、${list(b.price, b.priceUnit)}です。年間支出額は${list(b.amount, '円')}、年間購入数量は${list(b.quantity, b.quantityUnit, b.quantityUnit === 'kg' ? 2 : 0)}です。`,
      '',
    ]),
    '<!-- WRITE:answer 「## この問いへの答え」の見出しで、問いに対する結論を2〜4段落で書く。言えないことは言えないと書く -->',
    '',
    '## 読むときの注意',
    '',
    '- 全国の二人以上の世帯の値で、年齢は世帯主の年齢です。購入しなかった世帯も含めた1世帯あたりの平均です。',
    '- 購入単価は年間支出額を年間購入数量で割った平均で、品質や銘柄の違いと値上がりの両方を含みます。',
    '- エンゲル係数は世帯人員や外食の多さにも左右されるので、係数だけで生活水準の高低は判断できません。',
    '',
    '## データの出典',
    '',
    `- 出典：総務省統計局「家計調査」(世帯主の年齢階級別、二人以上の世帯、統計表ID ${AMOUNT_TABLE}・${QUANTITY_TABLE})（${SOURCE_URL}）を加工して作成`,
    '',
  ].join('\n');
  const draftPath = path.join(dir, 'draft.md');
  if (!existsSync(draftPath) || readFileSync(draftPath, 'utf8').includes('<!-- WRITE:intro'))
    writeFileSync(draftPath, ['---', 'title: "<!-- WRITE:title -->"', 'description: "<!-- WRITE:description -->"', 'status: draft',
      'published: false', `analysis: ${a.id}`, 'tags:', '  - 家計調査', '  - エンゲル係数', '  - 統計データ', '  - stats47', '---', '', body].join('\n'));
  if (process.argv.includes('--register')) registerArticle(a, key, 's47-kakei-reading', []);
  return key;
}

async function main() {
  const a = loadAnalyses().find((x: Analysis) => x.id === arg('--analysis'));
  if (!a) throw new Error('使い方: --analysis <企画ID> [--register]');
  console.log(`✓ ${a.id} → ${await build(a)}`);
}

if (require.main === module) main();
