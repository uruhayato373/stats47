/**
 * figure-year-lint — 図を貼った節の本文が語る年と、その図の data JSON の年が、1 つも重ならない節を検出する
 * (BLOG-REVISE-PATTERNS-01、2026-11-14 追加)。
 *
 * 事象: 2026-10-07 の書き直しで、本文の値と図の年が違うのに理由が書かれていない記事 (area-ratio-prefecture-gap) を
 * critic が REVISE にした。critic の型は `year`。読者は節の本文の年の値を図で確かめようとするので、図が別の年だと
 * 照合できない。
 *
 * 判定 (節 = 見出し `##` / `###` から次の見出しまで):
 *   1. 節の中の画像 `![](data/<base>.svg)` (`-ig` は同じ図の縦長版) の図の年を、title-year-lint の extractChartYears で取る
 *      (source.json の year を優先し、範囲「2013-2018」は時点の年に数えない)。年の取れない図は対象外
 *   2. 節の地の文 (画像・リンク先 URL を除く) に「NNNN年」「NNNN年度」が 1 つ以上ある
 *   3. 節の見出し・画像の代替テキストを含む全文に、図の年のどれも書かれていない
 *   4. 節に「図は最新年」「年が異なる」のように年の違いを断る言い回し (REASON_RE) が無い
 *   すべて満たす節を FIGURE_YEAR_MISMATCH とする。図の年を 1 回でも書いてあれば (理由として「図は 2020 年」と
 *   書く形も含め) 読者は年の違いに気づけるので対象外。
 *
 * 判定しないもの: 節の本文に年が無い (図の年を語っていない) / 図の年を書いた節に別の年も書いてある (時系列の比較は正当)。
 *
 * 実測 (2026-11-14・contents/blog の公開済み 294 本): 図 649 枚のうち年が取れる 630 枚、本文に年がある節に貼った図は 158 枚で、
 * 年が 1 つも重ならない節は 0 件。
 */
import { extractChartYears } from './title-year-lint.mjs';

const HEADING_RE = /^#{2,3}\s/;
const IMAGE_RE = /!\[([^\]]*)\]\(data\/([^)\s]+?)\.svg\)/g;
const YEAR_MENTION_RE = /(?<![\d,.])((?:19|20)\d{2})\s*年/g;
/** 図の年が本文の年と違うことを断る言い回し。図の年そのものを書く形は「図の年が書いてある」で別に通る */
const REASON_RE =
  /図(?:は|の年は)最新|最新(?:の)?年(?:の|を)?(?:値|図|データ)|年(?:が|は)(?:異な|違|ず)|年次(?:が|は)(?:異な|違|ず)|年をそろえ|年が揃|公表されて(?:いない|おらず)|未公表/;

function splitSections(content) {
  const body = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  const sections = [];
  let cur = { heading: '', lines: [] };
  for (const line of body.split('\n')) {
    if (HEADING_RE.test(line)) {
      sections.push(cur);
      cur = { heading: line, lines: [] };
    } else cur.lines.push(line);
  }
  sections.push(cur);
  return sections;
}

/** 図の年は ig (縦長) の方に付いた名前を剥がして data JSON の base に戻す */
function baseOf(name) {
  return name.replace(/-ig$/, '');
}

/**
 * @param {string} content article.md 全文
 * @param {{base:string, json:any, source:any}[]} charts 本文が参照する図 (quality-gate の articleCharts)
 * @returns {{blockers:string[], warnings:string[], hits:{heading:string, figureYears:number[], textYears:number[]}[]}}
 */
export function lintFigureYearMention(content, charts) {
  const yearsByBase = new Map();
  for (const c of charts) {
    yearsByBase.set(
      c.base,
      extractChartYears(c.json, c.source).map((y) => y.year)
    );
  }
  const blockers = [];
  const hits = [];

  for (const section of splitSections(content)) {
    const text = [section.heading, ...section.lines].join('\n');
    const figureYears = new Set();
    const bases = new Set();
    for (const m of text.matchAll(IMAGE_RE)) {
      const base = baseOf(m[2]);
      const years = yearsByBase.get(base);
      if (!years || years.length === 0) continue;
      bases.add(base);
      for (const y of years) figureYears.add(y);
    }
    if (figureYears.size === 0) continue;

    const prose = text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\]\([^)]*\)/g, ']');
    const textYears = [
      ...new Set([...prose.matchAll(YEAR_MENTION_RE)].map((m) => Number(m[1]))),
    ];
    if (textYears.length === 0) continue;

    const allYears = new Set(
      [...text.matchAll(YEAR_MENTION_RE)].map((m) => Number(m[1]))
    );
    if ([...figureYears].some((y) => allYears.has(y))) continue;
    if (REASON_RE.test(prose)) continue;

    const heading = section.heading.replace(/^#+\s*/, '') || '(導入)';
    hits.push({ heading, figureYears: [...figureYears], textYears });
    blockers.push(
      `FIGURE_YEAR_MISMATCH: 節「${heading}」の本文は ${textYears.join('・')}年 を語っていますが、貼った図 (${[...bases].join(', ')}) は ${[...figureYears].join('・')}年 で、図の年が本文のどこにも書かれていません。本文の年の図に差し替えるか、図の年と違う理由を書いてください`
    );
  }
  return { blockers, warnings: [], hits };
}
