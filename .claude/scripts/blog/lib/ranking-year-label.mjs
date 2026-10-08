/**
 * ranking-year-label — ranking の年コードを図の見出し用の表記 (「2021年」/「2021年度」) にする (純粋関数)。
 *
 * なぜ要るか (BLOG-FETCH-RANKING-FISCAL-01): fetch-ranking-data-r2.mjs が subtitle を `${year}年` で固定しており、
 * 年度の指標 (県民所得・財政力指数など) の図に「2021年」と書いていた。年と年度の取り違えは
 * blog-critic が BLOCK にする定義違反 (blog-quality-standards.md「定義整合」)。
 *
 * 判定の正本は metric config の yearFormat。R2 の item.json は yearFormat を直接持たず、
 * builder (packages/ranking の yearNameOf) が yearFormat から作った availableYears[].yearName を持つので、
 *   1. item.yearFormat があればそれ ("fiscal" → 年度)
 *   2. 無ければ availableYears / latestYear の yearName が「年度」で終わるか
 *   3. どちらも無ければ暦年 (従来どおり)
 * の順で決める。
 */

/**
 * @param {{ yearFormat?: string, availableYears?: Array<{yearName?: string}>|null, latestYear?: {yearName?: string}|null }} item
 * @returns {"fiscal" | "calendar"}
 */
export function resolveYearFormat(item) {
  if (item?.yearFormat) return item.yearFormat === "fiscal" ? "fiscal" : "calendar";
  const names = [...(item?.availableYears ?? []), item?.latestYear]
    .map((year) => year?.yearName)
    .filter((name) => typeof name === "string" && name.length > 0);
  if (names.length === 0) return "calendar";
  return names.every((name) => name.endsWith("年度")) ? "fiscal" : "calendar";
}

/**
 * @param {string|number} yearCode
 * @param {Parameters<typeof resolveYearFormat>[0]} item
 */
export function yearLabelOf(yearCode, item) {
  return resolveYearFormat(item) === "fiscal" ? `${yearCode}年度` : `${yearCode}年`;
}
