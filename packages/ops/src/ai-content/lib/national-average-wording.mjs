/**
 * AI 解説の「全国平均」を「N都道府県の単純平均」へ機械で置き換えられるかの判定 (純関数・読み取りだけ)。
 *
 * 背景: 2026-09-27 より前の生成は、都道府県の単純平均を常に「全国平均」と呼んでいた。公表の全国値が無いのに
 * 「全国平均」と書くと単純平均を全国値と誤読させるので、生成の側は今「全国値」(公表値あり) か
 * 「N都道府県の単純平均」(公表値なし) と呼ぶ (`ranking-content-prompt.ts` の averageLabel)。
 * ここでは古い解説の 1 か所ごとに、次の 3 つのどれかを決める。
 *
 *   replaceable = 比較基準の名詞として置いても文が崩れない (直後が助詞・句読点・「値」「水準」など)
 *   regenerate  = 言い換えると文が崩れる、または言い換えで意味が曖昧になる。作り直しの経路へ回す
 *   official    = 公表の全国値を指している (行に公表の全国値がある、または文が公表値だと言っている)。対象外
 *
 * 入口 (公開 R2 を読む dry-run): `.claude/scripts/ai-content/audit-national-average-wording.mjs`。
 *
 * 置換そのものはここで行わない。`replaceReplaceable` は replaceable だけを置き換えた文字列を返す純関数で、
 * 書き込みは呼び出し側 (CLI は dry-run で書かない) が決める。
 */

export const TARGET = "全国平均";

/** 「全国平均」の直後に来てよい文字。ここに無い文字 (寿命・年収・点など) は指標名の一部で、言い換えると崩れる */
const SAFE_NEXT = /^(?:$|[値水準はがをにのもでとやへよらま、。，,）)」』？?！!\s\\並付前程比以超未近上下ほだ])/;

/** 文が公表の全国値を指していると自分で言っている語 */
const OFFICIAL_CUE = /公表|公式|政府統計|統計局|総務省|厚生労働省|文部科学省|全国値|全国計/;

/** 単純平均と書いた文に「全国平均」が同居していると、言い換えで二重になる */
const ALREADY_SIMPLE = /単純平均/;

/** index を含む文 (前の句点・改行・JSON の改行記号から次の句点まで) */
function sentenceAround(text, index) {
  const before = text.slice(0, index);
  const start = Math.max(before.lastIndexOf("。"), before.lastIndexOf("\n"), before.lastIndexOf("\\n")) + 1;
  const afterIdx = text.indexOf("。", index);
  const end = afterIdx === -1 ? text.length : afterIdx + 1;
  return text.slice(start, end);
}

/**
 * 「全国平均」の出現 1 か所を判定する。
 * @param {string} text
 * @param {number} index 「全国平均」の先頭の位置
 * @param {{ hasPublishedNational?: boolean }} [context] 行に公表の全国値 (areaCode 00000) があるか
 * @returns {"replaceable" | "regenerate" | "official"}
 */
export function classifyOccurrence(text, index, context = {}) {
  if (context.hasPublishedNational) return "official";
  const sentence = sentenceAround(text, index);
  if (OFFICIAL_CUE.test(sentence)) return "official";
  if (ALREADY_SIMPLE.test(sentence)) return "regenerate";
  const next = text.slice(index + TARGET.length, index + TARGET.length + 2);
  if (!SAFE_NEXT.test(next)) return "regenerate";
  return "replaceable";
}

/** 全ての出現位置 */
export function findOccurrences(text) {
  const positions = [];
  if (typeof text !== "string") return positions;
  for (let i = text.indexOf(TARGET); i !== -1; i = text.indexOf(TARGET, i + TARGET.length)) positions.push(i);
  return positions;
}

/** 文字列 1 つの出現を数える */
export function countByVerdict(text, context = {}) {
  const counts = { replaceable: 0, regenerate: 0, official: 0 };
  for (const i of findOccurrences(text)) counts[classifyOccurrence(text, i, context)] += 1;
  return counts;
}

/** replaceable な出現だけを置き換えた文字列と、置いた数・残った数を返す */
export function replaceReplaceable(text, label, context = {}) {
  if (typeof text !== "string") return { text, replaced: 0, remaining: 0 };
  let out = "";
  let last = 0;
  let replaced = 0;
  let remaining = 0;
  for (const i of findOccurrences(text)) {
    if (classifyOccurrence(text, i, context) === "replaceable") {
      out += text.slice(last, i) + label;
      last = i + TARGET.length;
      replaced += 1;
    } else {
      remaining += 1;
    }
  }
  return { text: out + text.slice(last), replaced, remaining };
}

/** 置き換え先の呼び名 */
export function simpleMeanWording(prefectureCount) {
  return `${prefectureCount}都道府県の単純平均`;
}

/** ai-content の行 (R2 の ai-content.json) の、本文にあたる欄 */
const TEXT_FIELDS = ["faq", "regionalAnalysis", "insights", "prefectureCommentary"];

/** 欄の値 (文字列・JSON 文字列・オブジェクトのどれでも) を 1 本の文字列に直す。JSON の中の文字列は元の書き方のまま比べられるよう文字列化する */
function fieldText(value) {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

/**
 * 行 1 件の判定。
 * @param {object} row ai-content.json
 * @param {{ hasPublishedNational?: boolean }} [context]
 * @returns {{ verdict: "none" | "replaceable" | "regenerate" | "official", counts: {replaceable:number, regenerate:number, official:number} }}
 *   none = 「全国平均」が無い / official = 公表の全国値なので対象外 / regenerate = 1 か所でも置換できない文がある / replaceable = 全て置換できる
 */
export function classifyRow(row, context = {}) {
  const counts = { replaceable: 0, regenerate: 0, official: 0 };
  for (const field of TEXT_FIELDS) {
    const c = countByVerdict(fieldText(row?.[field]), context);
    counts.replaceable += c.replaceable;
    counts.regenerate += c.regenerate;
    counts.official += c.official;
  }
  const total = counts.replaceable + counts.regenerate + counts.official;
  if (total === 0) return { verdict: "none", counts };
  if (counts.official > 0) return { verdict: "official", counts };
  if (counts.regenerate > 0) return { verdict: "regenerate", counts };
  return { verdict: "replaceable", counts };
}

/**
 * 行の本文の欄を置き換えた新しい行を返す (元の行は変えない)。置き換えるのは replaceable だけ。
 * 欄が文字列で JSON のとき (faq・prefectureCommentary) は、文字列のまま置換しても JSON として壊れない
 * (「全国平均」も置換後の呼び名も JSON の記号を含まない)。
 */
export function applyReplacement(row, label, context = {}) {
  const next = { ...row };
  let replaced = 0;
  let remaining = 0;
  for (const field of TEXT_FIELDS) {
    const value = row?.[field];
    if (typeof value === "string") {
      const r = replaceReplaceable(value, label, context);
      next[field] = r.text;
      replaced += r.replaced;
      remaining += r.remaining;
    } else if (value && typeof value === "object") {
      const r = replaceReplaceable(JSON.stringify(value), label, context);
      next[field] = JSON.parse(r.text);
      replaced += r.replaced;
      remaining += r.remaining;
    }
  }
  return { row: next, replaced, remaining };
}
