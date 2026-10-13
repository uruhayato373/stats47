#!/usr/bin/env tsx
/**
 * 教材の分析企画のうち「地方ごとに各県の全体像を組み立てられるか」を問うもの (prefecture-ranking-consumption の a47〜a52) を、
 * R2 の県データブック (app/areas/<code>/databook.json) から note 記事の作業コピーにする。
 * 各県の指標は県ページ・Instagram と同じ選定 (selectAreaHighlights) で、全国上位・下位に入るものを選ぶ。
 * 「強み・弱み」とは書かない (area-databook-standards §2.1)。執筆・検査・保存は `/expand-reference-notes`。
 *
 *   npx tsx .claude/scripts/note/reference/build-reference-note-region.ts --analysis <企画ID> [--register]
 *   npx tsx .claude/scripts/note/reference/build-reference-note-region.ts --pending [--register]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { selectAreaHighlights, type AreaHighlight } from '../../../../packages/area-profile/src/highlights/select-area-highlights.ts';
import { R2_PUBLIC_BASE_URL } from '../../lib/site-config.cjs';
import { expansionStatus, loadAnalyses, loadChannelIndex, loadExpansion } from '../../source-vault/lib/reference-expansion.mjs';
import { type Analysis, articleKeyOf, fmt, mergeWritten, registerArticle } from './build-reference-note';
import { qualifyLabel } from './lib/estat-denominator';

const ROOT = path.resolve(__dirname, '../../../..');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const WORK_ROOT = path.join(ROOT, 'docs/31_note記事原稿');
const PER_GROUP = 3;
/** 企画 → 地方名と都道府県コードの範囲 */
const REGIONS: Record<string, [string, number, number]> = {
  'prefecture-ranking-consumption-2020-a47': ['北海道・東北', 1, 7],
  'prefecture-ranking-consumption-2020-a48': ['関東', 8, 14],
  'prefecture-ranking-consumption-2020-a49': ['中部', 15, 23],
  'prefecture-ranking-consumption-2020-a50': ['近畿', 24, 30],
  'prefecture-ranking-consumption-2020-a51': ['中国・四国', 31, 39],
  'prefecture-ranking-consumption-2020-a52': ['九州・沖縄', 40, 47],
};

class Blocked extends Error {}
const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const register = process.argv.includes('--register');

type Pref = { areaCode: string; areaName: string; top: AreaHighlight[]; bottom: AreaHighlight[] };

const valueText = (h: AreaHighlight) => {
  const digits = Number.isInteger(h.value) ? 0 : String(h.value).split('.')[1].length > 1 ? 2 : 1;
  return `${fmt(h.value, digits)}${h.unit}`;
};
const itemText = (h: AreaHighlight) => `${h.label}(${h.rank}位、${valueText(h)}、${h.year})`;

function prefSection(p: Pref) {
  const lines = [`## ${p.areaName}`, ''];
  lines.push(p.top.length ? `全国で上位に入る指標は、${p.top.map(itemText).join('、')}です。` : '全国で上位10位以内に入る指標は選ばれませんでした。');
  lines.push('', p.bottom.length ? `全国で下位に入る指標は、${p.bottom.map(itemText).join('、')}です。` : '全国で下位10位以内に入る指標は選ばれませんでした。');
  const kakei = [...p.top, ...p.bottom].filter((h) => h.isKakei);
  if (kakei.length) lines.push('', `このうち${kakei.map((h) => h.label).join('・')}は家計調査の値で、県全体ではなく県庁所在市の二人以上の世帯の値です。`);
  lines.push('', `${p.areaName}の指標は[stats47の${p.areaName}のページ](https://stats47.jp/areas/${p.areaCode})でまとめて確認できます。`);
  return lines.join('\n');
}

function draftOf(a: Analysis, region: string, prefs: Pref[]) {
  const body = [
    '<!-- WRITE:intro 問いを読者の言葉で立て、答えの要旨を2〜3段落で書く。数値は下の節と chart-data.json にあるものだけを使う。「強み・弱み」とは書かない -->',
    '',
    '## 指標の選び方',
    '',
    `stats47 の県ページと同じ方法で、${region}の各県について全国で上位10位以内・下位10位以内に入る指標を${PER_GROUP}件ずつ選びました。` +
      '同じ分野の指標や似た指標は1件にまとめ、家計調査の品目は1県につき各2件までにしています。順位は値の大きい順で、上位・下位は良し悪しではありません。',
    '',
    ...prefs.flatMap((p) => [prefSection(p), '']),
    '<!-- WRITE:answer 「## この問いへの答え」の見出しで、問いに対する結論を2〜4段落で書く。言えないことは言えないと書く -->',
    '',
    '## 読むときの注意',
    '',
    '- 指標ごとに調査の年が異なります。順位は47都道府県の中での位置で、値の大きい順です。',
    '- 上位・下位は値の大小で、その県にとって良いか悪いかを示すものではありません。',
    '',
    '## データの出典',
    '',
    '- 各指標の出典は stats47 の県ページと各ランキングページに記載しています (e-Stat ほか政府統計を加工して作成)。',
    '',
  ].join('\n');
  const tags = ['都道府県', '統計データ', 'stats47', region, ...prefs.slice(0, 2).map((p) => p.areaName)];
  return ['---', 'title: "<!-- WRITE:title -->"', 'description: "<!-- WRITE:description -->"', 'status: draft', 'published: false',
    `analysis: ${a.id}`, 'tags:', ...tags.map((t) => `  - ${t}`), '---', '', body].join('\n');
}

async function build(a: Analysis) {
  const region = REGIONS[a.id];
  if (!region) throw new Blocked(`${a.id}: 地方ごとの企画ではない`);
  const [name, lo, hi] = region;
  const prefs: Pref[] = [];
  for (let n = lo; n <= hi; n++) {
    const code = `${String(n).padStart(2, '0')}000`;
    const res = await fetch(`${R2}/app/areas/${code}/databook.json`);
    if (!res.ok) throw new Blocked(`${code}: databook.json HTTP ${res.status}`);
    const databook = await res.json();
    const { top, bottom } = selectAreaHighlights(databook, { perGroup: PER_GROUP });
    // 県データブックの表示名は分母を落としていることがあるので、ランキングの取得設定から e-Stat の項目名で補う
    for (const h of [...top, ...bottom]) {
      const item = await fetch(`${R2}/app/ranking/${h.rankingKey}/item.json`);
      if (item.ok) h.label = await qualifyLabel(h.label, (await item.json()).item?.sourceConfig?.recipe);
    }
    prefs.push({ areaCode: code, areaName: databook.areaName, top, bottom });
  }
  const key = articleKeyOf(a);
  const dir = path.join(WORK_ROOT, key);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'chart-data.json'), `${JSON.stringify({ analysisId: a.id, question: a.question, kind: 'region', region: name, generatedAt: new Date().toISOString(), prefectures: prefs }, null, 2)}\n`);
  writeFileSync(path.join(dir, 'data-provenance.json'), `${JSON.stringify({
    analysisId: a.id, inputs: prefs.map((p) => ({ areaCode: p.areaCode, r2: `app/areas/${p.areaCode}/databook.json` })),
    selection: 'packages/area-profile selectAreaHighlights perGroup=3',
    restore: `npx tsx .claude/scripts/note/reference/build-reference-note-region.ts --analysis ${a.id}`,
  }, null, 2)}\n`);
  {
    const draftPath = path.join(dir, 'draft.md'), fresh = draftOf(a, name, prefs);
    writeFileSync(draftPath, existsSync(draftPath) ? mergeWritten(readFileSync(draftPath, 'utf8'), fresh) : fresh);
  }
  if (register) registerArticle(a, key, 's47-population', prefs.map((p) => `/areas/${p.areaCode}`));
  return { key, prefs: prefs.length };
}

async function main() {
  const analyses: Analysis[] = loadAnalyses();
  let targets: Analysis[];
  if (arg('--analysis')) targets = analyses.filter((x) => x.id === arg('--analysis'));
  else if (process.argv.includes('--pending'))
    targets = expansionStatus(analyses, loadExpansion(), loadChannelIndex())
      .filter((r: { channel: string; state: string; analysis: Analysis }) => r.channel === 'note' && r.state === 'pending' && REGIONS[r.analysis.id])
      .map((r: { analysis: Analysis }) => r.analysis);
  else {
    console.error('使い方: --analysis <企画ID> | --pending  [--register]');
    process.exit(2);
  }
  if (!targets.length) throw new Error('対象の企画が無い');
  let failed = 0;
  for (const a of targets) {
    try {
      const out = await build(a);
      console.log(`✓ ${a.id} → ${out.key} (${out.prefs} 県)`);
    } catch (error) {
      failed++;
      console.error(`✗ ${a.id}: ${(error as Error).message}`);
      if (!(error instanceof Blocked)) throw error;
    }
  }
  if (failed) process.exitCode = 1;
}

if (require.main === module) main();
