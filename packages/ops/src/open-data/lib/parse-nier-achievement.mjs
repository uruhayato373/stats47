/**
 * 国立教育政策研究所「全国学力・学習状況調査 実施概況 全国－都道府県（公立）」(小学校 p_101・中学校 m_101 の
 * PDF 1 枚目の表) から、都道府県 (公立) の教科別平均正答率を取り出す。令和 4・5・6 年度 (2022〜2024) 用。
 *
 * 出典 (取得 2026-11-25):
 *   https://www.nier.go.jp/22chousakekkahoukoku/factsheet/22p_101.pdf  (…/22m_101.pdf)
 *   https://www.nier.go.jp/23chousakekkahoukoku/factsheet/23p_101.pdf  (…/23m_101.pdf)
 *   https://www.nier.go.jp/24chousakekkahoukoku/factsheet/24P_101.pdf  (…/24m_101.pdf)
 * 入力は `pdftotext -layout` の出力テキスト。
 *
 * 行の形: 「<県名> <教育委員会数 全体・実施> <学校数 対象・実施> <人数 教科ごと + 質問> <教科ごとの 平均正答数 ( 平均正答率 ) と
 * 層分布> ...」。都道府県の行の平均正答率は公表のとおり整数 %、「全国（公立）」の行だけ小数 1 位。
 * 教科の並びは見出し行の「国語(％) 算数(％) …」から読む (年・校種で違う: 令和 4 年度は理科、令和 5 年度の中学校は英語を含む)。
 *
 * 検算 (崩れたら取り出さずに投げる): 47 県が欠測・重複なく並ぶ / 行ごとの教科数と人数の列数が見出しと一致 / 県の値が 0〜100 /
 * 県の値を教科の受験者数で加重した平均が「全国（公立）」の値と 0.6 ポイント以内 (県値は整数への丸め) /
 * 「全国（公立）」と「全国（国公私立）」の行がある。
 *
 * 年をまたぐ比較: 公式は「各年度の問題の難易度を厳密に調整する設計とはしておらず、年度によって出題内容も異なることから、
 * 過年度の結果と単純に比較することは適当ではない」と書く
 * (令和 6 年度 https://www.nier.go.jp/_uploads/2026/03/24summary_01.pdf p.3、
 *  令和 5 年度 https://www.nier.go.jp/23chousakekkahoukoku/report/data/23summary.pdf)。
 * 令和 4 年度の概要 (https://www.nier.go.jp/22chousakekkahoukoku/22summary.pdf) にはこの注記が見つからなかった。
 * したがって年ごとの平均正答率は水準を並べず、その年の全国 (公立) との差で比べる (`diffFromNational`)。
 *
 * 実行: node packages/ops/src/open-data/lib/parse-nier-achievement.mjs <pdf>
 */
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { PREF_NAMES } from '../../../../area/mirror/prefectures.cjs';

export function pdfToText(pdfPath) {
  return execFileSync('pdftotext', ['-layout', '-f', '1', '-l', '1', pdfPath, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

const normalize = (s) => s.normalize('NFKC');
const PAIR = /(\d+(?:\.\d+)?)\s*\(\s*(\d+(?:\.\d+)?)\s*\)/g;
const WEIGHT_TOLERANCE = 0.6;

function toNumber(token, where) {
  const n = Number(token.replace(/,/g, ''));
  if (!Number.isFinite(n)) throw new Error(`数値でないセル ${where}: ${JSON.stringify(token)}`);
  return n;
}

/** 表の 1 行を { label, counts, rates } にする。教科の列数 n に合わなければ投げる。 */
function parseRow(line, subjects) {
  const m = line.match(/^(\S+)\s+(.*)$/);
  if (!m) return null;
  const rest = m[2];
  const pairs = [...rest.matchAll(PAIR)];
  if (pairs.length < subjects.length) return null;
  const head = rest.slice(0, pairs[0].index).trim().split(/\s+/);
  // 教育委員会数 2 + 学校数 2 + 人数 (教科数 + 質問 1)
  if (head.length !== 4 + subjects.length + 1) throw new Error(`${m[1]}: 人数の列数 ${head.length} が想定 ${5 + subjects.length} と違う`);
  const nums = head.map((t) => (/^[－-]$/.test(t) ? null : toNumber(t, `${m[1]} 度数`)));
  const students = Object.fromEntries(subjects.map((s, i) => [s, nums[4 + i]]));
  const rates = Object.fromEntries(subjects.map((s, i) => [s, toNumber(pairs[i][2], `${m[1]} ${s}`)]));
  return { label: m[1], students, rates };
}

/**
 * @param {string} text pdftotext -layout の 1 ページ目
 * @returns {{fiscalYear: number, schoolLevel: 'elementary'|'junior-high', subjects: string[],
 *   national: {public: Record<string, number>, all: Record<string, number>},
 *   prefectures: Array<{prefName: string, rates: Record<string, number>, students: Record<string, number>}>}}
 */
export function parseNierAchievement(text) {
  const lines = text.split('\n').map(normalize);
  const year = lines[0]?.match(/令和(\d+)年度/);
  if (!year) throw new Error('1 行目に「令和N年度」がありません');
  const fiscalYear = 2018 + Number(year[1]);
  const schoolLevel = lines[0].includes('小学校調査') ? 'elementary' : lines[0].includes('中学校調査') ? 'junior-high' : null;
  if (!schoolLevel) throw new Error('小学校調査・中学校調査の別が読めません');

  const start = lines.findIndex((l) => /^全国-都道府県\(公立\)\s*$/.test(l));
  if (start < 0) throw new Error('「全国－都道府県（公立）」の表が見つかりません');
  let end = lines.findIndex((l, i) => i > start && /^全国-/.test(l));
  if (end < 0) end = lines.length;
  const section = lines.slice(start + 1, end);

  const headLine = section.find((l) => l.includes('教育委員会数') && l.includes('(%)'));
  if (!headLine) throw new Error('教科の見出し行 (「国語(％)」など) がありません');
  const subjects = [...headLine.matchAll(/([^\s()%]+)\(%\)/g)].map((m) => m[1]);
  if (subjects.length < 2) throw new Error(`教科が読めません: ${subjects}`);

  let nationalPublic = null;
  let nationalAll = null;
  const byPref = new Map();
  for (const line of section) {
    const row = parseRow(line, subjects);
    if (!row) continue;
    if (row.label === '全国(公立)') {
      if (nationalPublic) throw new Error('全国（公立）の行が重複しています');
      nationalPublic = row;
    } else if (row.label === '全国(国公私立)') {
      if (nationalAll) throw new Error('全国（国公私立）の行が重複しています');
      nationalAll = row;
    } else {
      if (!PREF_NAMES.includes(row.label)) throw new Error(`都道府県でも全国でもない行: ${row.label}`);
      if (byPref.has(row.label)) throw new Error(`県の重複: ${row.label}`);
      byPref.set(row.label, row);
    }
  }
  if (!nationalPublic) throw new Error('全国（公立）の行がありません');
  if (!nationalAll) throw new Error('全国（国公私立）の行がありません');
  if (byPref.size !== 47) throw new Error(`県数 ${byPref.size} != 47`);
  for (const n of PREF_NAMES) if (!byPref.has(n)) throw new Error(`${n} の行がありません`);

  for (const s of subjects) {
    let weighted = 0;
    let total = 0;
    for (const [name, row] of byPref) {
      const r = row.rates[s];
      if (r < 0 || r > 100) throw new Error(`${name} ${s}: 値 ${r} が 0〜100 の外`);
      weighted += r * row.students[s];
      total += row.students[s];
    }
    const mean = weighted / total;
    if (Math.abs(mean - nationalPublic.rates[s]) > WEIGHT_TOLERANCE) {
      throw new Error(`${s}: 47 県の加重平均 ${mean.toFixed(2)} と全国（公立）${nationalPublic.rates[s]} の差が ${WEIGHT_TOLERANCE} を超える`);
    }
  }

  return {
    fiscalYear,
    schoolLevel,
    subjects,
    national: { public: nationalPublic.rates, all: nationalAll.rates },
    prefectures: PREF_NAMES.map((prefName) => {
      const { rates, students } = byPref.get(prefName);
      return { prefName, rates, students };
    }),
  };
}

/** 県の値 − その年の全国（公立）。年をまたぐ水準の比較ができないため、年を並べるときはこの差を使う。 */
export function diffFromNational(parsed, subject) {
  const base = parsed.national.public[subject];
  if (base === undefined) throw new Error(`教科 ${subject} がありません`);
  return parsed.prefectures.map((p) => ({ prefName: p.prefName, diff: Math.round((p.rates[subject] - base) * 10) / 10 }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pdf = process.argv[2];
  if (!pdf) throw new Error('usage: parse-nier-achievement.mjs <pdf>');
  const r = parseNierAchievement(pdfToText(pdf));
  console.log(`${r.fiscalYear} ${r.schoolLevel} 教科 ${r.subjects.join('・')} 全国(公立) ${JSON.stringify(r.national.public)} 47 県の加重平均と一致`);
}
