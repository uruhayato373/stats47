/**
 * paren-number-lint — 都道府県名の直後の括弧に値・順位を併記した箇所を検出する (共有ライブラリ)
 *
 * ルールの所在 (2026-07-31 に blog へも導入):
 *   - ranking ai-content: `.claude/rules/ranking-content-standards.md` + 生成プロンプト
 *   - blog:              `.claude/rules/blog-quality-standards.md`「数値の書き方」
 *
 *   NG:「愛知県（746.0万人）が4位」「石川県（2.5人、31位）」
 *   OK:「愛知県は746.0万人で4位となっています」
 *
 * なぜ禁じるか: 括弧内の数値は主指標か別指標かを機械が判別できず、value 照合
 * (article-factual-check) が**括弧内を対象から外している**。括弧に入れた数値は誰にも
 * 検証されない。散文に開けば照合対象に入る。
 *
 * 既存負債: 公開済み 424 記事の 79.5% (4,671 箇所) が該当する。blocker だが、gate が
 * かかるのは「これから公開する記事」なので既存記事は brushup で順次是正される。
 *
 * 判定は ai-content の audit-ai-content.mjs と同じ許容規則に揃える (二重基準を作らない):
 *   - 数字を含まない括弧は対象外
 *   - 「(2020年度)」のような年度表記は許容
 *   - 「(出典…)」「(注…)」「(※…)」は許容
 *
 * 加えてブログ固有の許容:
 *   - markdown リンクの URL 部 `](...)` は括弧ではない
 *   - コードブロック内は対象外
 */

import { PREF_NAMES } from "./article-factual-check.mjs";

/**
 * ★検出条件は規約の原文どおり「**都道府県名の直後**の括弧」に限定する。
 *
 * 括弧に数字が入っていれば何でも違反、とすると公開済み 424 記事の **97.6%** が該当し、
 * 実際には正当な注記まで巻き込む (2026-07-31 実測):
 *   「(人口10万人当たり)」「(2人以上)」「(10歳以上)」「(令和5年推計)」
 *   「(2021年・社会生活基本調査)」「(全国順位を0〜100点に変換)」
 * これらは単位・対象・出典の限定であって「値の挿入」ではない。
 *
 * 規約が禁じているのは値・順位の併記:
 *   NG:「愛知県（746.0万人）が4位」「石川県（2.5人、31位）」
 *   OK:「愛知県は4位で、中部地方の中核を担っている」
 */
const PREF_PAREN_RE = new RegExp(
  `(?:${PREF_NAMES.join("|")})(?:都|道|府|県)?\\s*[（(]([^（()）]*)[）)]`,
  "g",
);
/** (2020年) / (2020年度) / (令和5年) は許容 */
const YEAR_PAREN_RE = /^\s*(?:\d{4}|令和\d+|平成\d+|昭和\d+)\s*年度?\s*$/;
/** (出典…) (注…) (※…) は許容 */
const ALLOW_PREFIX_RE = /^\s*(?:出典|参考|注|注記|※|Source|source)/;

/** コードブロックと markdown リンクの URL 部を空白で潰す (行数・位置は保つ) */
function maskNonProse(md) {
  return md
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/`[^`\n]*`/g, (span) => span.replace(/[^\n]/g, " "))
    // ](...) / ](…) の括弧内は URL なので対象外
    .replace(/\]\([^)\n]*\)/g, (link) => link.replace(/[^\n]/g, " "));
}

/**
 * 括弧内数値挿入を検出する。
 *
 * @param {string} md 記事本文 (frontmatter 込みで可)
 * @returns {{ blockers: string[], warnings: string[], hits: {text: string, line: number}[] }}
 */
export function lintParenNumbers(md) {
  const body = String(md ?? "").replace(/^---[\s\S]*?\n---\n/, "");
  const masked = maskNonProse(body);

  const hits = [];
  let m;
  PREF_PAREN_RE.lastIndex = 0;
  while ((m = PREF_PAREN_RE.exec(masked)) !== null) {
    const inner = m[1];
    if (!/[0-9０-９]/.test(inner)) continue;
    if (YEAR_PAREN_RE.test(inner)) continue;
    if (ALLOW_PREFIX_RE.test(inner)) continue;
    const line = masked.slice(0, m.index).split("\n").length;
    hits.push({ text: m[0].trim(), line });
  }

  const blockers = hits.length
    ? [
        `paren-number: 都道府県名の直後に値・順位を括弧で併記 ${hits.length} 件 — ` +
          `括弧内の数値は factual-check の照合対象外になり検証不能になる。` +
          `「愛知県は746.0万人で4位」のように散文へ開くこと ` +
          `(blog-quality-standards.md「数値の書き方」)。例: ` +
          hits
            .slice(0, 3)
            .map((h) => `L${h.line}${h.text}`)
            .join(" / "),
      ]
    : [];

  return { blockers, warnings: [], hits };
}
