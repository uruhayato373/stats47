/**
 * 社会・人口統計体系の「指標計算式」から、分子に出てくる基礎項目のコードを取り出す。
 *
 * 指標 (#A05202 粗出生率 = A4101/A1101 など) の資料源は、式に出る基礎項目すべての資料源を合わせたものなので、
 * 人口や面積で割っただけの指標にも分母の調査 (国勢調査・人口推計・面積調) が付く。調査のページへ並べる
 * 「主出典」は分子の調査だけにする (2026-11-14。国勢調査のページに粗出生率・道路実延長・警察費が並んでいた)。
 *
 * 式の形の出典: 総務省統計局「社会生活統計指標一覧」の指標計算式 (cdcat01-sources.generated.json の formula)。
 */

/** 基礎項目コード: 英大文字 1 字 + 数字 3〜7 桁 (extract-ssds-sources.py の BASE_RE と同じ) */
const BASE_CODE = /[A-Z]\d{3,7}/g;

const OPEN_PARENS = new Set(['(', '（']);
const CLOSE_PARENS = new Set([')', '）']);

/** 括弧の外にある最初の「/」より前 (= 分子)。括弧の外に「/」が無い式は式の全体を返す。 */
function numeratorPart(line: string): string {
  let depth = 0;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (OPEN_PARENS.has(ch)) depth += 1;
    else if (CLOSE_PARENS.has(ch)) depth -= 1;
    else if (ch === '/' && depth === 0) return line.slice(0, i);
  }
  return line;
}

/**
 * 指標計算式の分子に出る基礎項目コード (出現順・重複なし)。
 * 期間ごとに式が変わる指標は改行で区切られているので、行ごとに分子を取って合わせる。
 */
export function numeratorBaseCodes(formula: string): string[] {
  const codes = formula
    .split('\n')
    .flatMap((line) => numeratorPart(line).match(BASE_CODE) ?? []);
  return [...new Set(codes)];
}
