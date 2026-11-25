/**
 * 内閣府男女共同参画局「配偶者暴力相談支援センターにおける相談件数等」(年度ごとの PDF) の
 * 「（３）都道府県別相談件数」の表から、全国と 47 都道府県の行を取り出す。
 *
 * 出典: https://www.gender.go.jp/policy/no_violence/e-vaw/data/pdf/<西暦>soudan.pdf
 *   (令和 4・5・6 年度分は 2022・2023・2024soudan.pdf。取得日 2026-11-25)
 * 入力は `pdftotext -layout` の出力テキスト。表の列は左から
 *   施設数 / 総数 / 来所 / 電話 / その他 / 総数 / 女 / 男 / その他 / 1 センター当たり相談件数 の 10 列。
 *
 * 検算 (崩れたら取り出さずに投げる): 47 県が欠測・重複なく並ぶ / 行ごとに 総数 = 来所 + 電話 + その他 =
 * 女 + 男 + その他 / 1 センター当たり = 総数 / 施設数 (小数 1 位) / 47 県の施設数と総数の和 = 全国の行。
 *
 * この表は設置主体 (都道府県・市町村) の別を持たない。県の行が県設置のみか市町村設置を含むかは
 * PDF から読めない。読めるのは「全センターが 47 県の行のどれかに入っている」(和が全国と一致) ことまで。
 * 実行: node packages/ops/src/open-data/lib/parse-dv-consultations.mjs <pdf>
 */
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { PREF_NAMES } from '../../../../area/mirror/prefectures.cjs';

const SECTION_HEAD = '都道府県別相談件数';
const COLUMNS = ['centers', 'total', 'visit', 'phone', 'otherMethod', 'totalBySex', 'female', 'male', 'otherSex', 'perCenter'];

export function pdfToText(pdfPath) {
  return execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

const prefByShort = new Map(PREF_NAMES.map((n) => [n === '北海道' ? n : n.slice(0, -1), n]));

function toNumber(token, where) {
  const n = Number(token.replace(/,/g, ''));
  if (!Number.isFinite(n)) throw new Error(`数値でないセル ${where}: ${JSON.stringify(token)}`);
  return n;
}

/** 表の 1 行 (「青 森     10    1,679 ...」) を { label, values } にする。表の行でなければ null。 */
function parseRow(line) {
  const m = line.match(/^\s*([^\d\s,.][^\d,.]*?)\s+(\d[\d,]*(?:\.\d+)?(?:\s+\d[\d,]*(?:\.\d+)?){9})\s*$/);
  if (!m) return null;
  const label = m[1].replace(/\s/g, '');
  const tokens = m[2].split(/\s+/);
  const values = Object.fromEntries(COLUMNS.map((c, i) => [c, toNumber(tokens[i], `${label} ${c}`)]));
  return { label, values };
}

/**
 * @param {string} text pdftotext -layout の出力
 * @param {{fiscalYear?: number}} [opts] fiscalYear は西暦の年度 (2024 = 令和 6 年度)。結果へ載せるだけ。
 * @returns {{fiscalYear: number|null, national: object, prefectures: Array<{prefName: string, centers: number, consultations: number, values: object}>}}
 */
export function parseDvConsultations(text, opts = {}) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.includes(SECTION_HEAD));
  if (start < 0) throw new Error(`「${SECTION_HEAD}」の節が見つかりません`);
  // 節の終わりは次の見出し (「２」で始まる行)
  let end = lines.findIndex((l, i) => i > start && /^\s*２\s/.test(l));
  if (end < 0) end = lines.length;

  let national = null;
  const byPref = new Map();
  for (const line of lines.slice(start + 1, end)) {
    const row = parseRow(line);
    if (!row) continue;
    if (row.label === '全国') {
      if (national) throw new Error('全国の行が重複しています');
      national = row.values;
      continue;
    }
    const prefName = prefByShort.get(row.label);
    if (!prefName) throw new Error(`都道府県でも全国でもない行: ${row.label}`);
    if (byPref.has(prefName)) throw new Error(`県の重複: ${prefName}`);
    byPref.set(prefName, row.values);
  }
  if (!national) throw new Error('全国の行がありません');
  if (byPref.size !== 47) throw new Error(`県数 ${byPref.size} != 47`);
  for (const n of PREF_NAMES) if (!byPref.has(n)) throw new Error(`${n} の行がありません`);

  const check = (label, v) => {
    if (v.visit + v.phone + v.otherMethod !== v.total) throw new Error(`${label}: 来所 + 電話 + その他 != 総数`);
    if (v.female + v.male + v.otherSex !== v.totalBySex) throw new Error(`${label}: 女 + 男 + その他 != 総数 (性別)`);
    if (v.total !== v.totalBySex) throw new Error(`${label}: 種類別の総数 != 性別の総数`);
    if (Math.abs(Math.round((v.total / v.centers) * 10) / 10 - v.perCenter) > 0.1001) throw new Error(`${label}: 1 センター当たり ${v.perCenter} != 総数 / 施設数`);
  };
  check('全国', national);
  let centers = 0;
  let total = 0;
  for (const [name, v] of byPref) {
    check(name, v);
    centers += v.centers;
    total += v.total;
  }
  if (centers !== national.centers) throw new Error(`47 県の施設数の和 ${centers} != 全国 ${national.centers}`);
  if (total !== national.total) throw new Error(`47 県の相談件数の和 ${total} != 全国 ${national.total}`);

  return {
    fiscalYear: opts.fiscalYear ?? null,
    national,
    prefectures: PREF_NAMES.map((prefName) => {
      const values = byPref.get(prefName);
      return { prefName, centers: values.centers, consultations: values.total, values };
    }),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pdf = process.argv[2];
  if (!pdf) throw new Error('usage: parse-dv-consultations.mjs <pdf>');
  const r = parseDvConsultations(pdfToText(pdf));
  console.log(`全国 ${r.national.centers} か所 / ${r.national.total} 件、47 県の和と一致`);
}
