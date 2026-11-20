/** 検索結果の ASIN の並びから、自分の本の順位 (1 始まり) を取り出す。 */
export function ranksFromResults(resultAsins, asinToId) {
  const seen = new Set();
  const unique = resultAsins.filter((asin) => !seen.has(asin) && seen.add(asin));
  return unique.flatMap((asin, index) => (asinToId.has(asin) ? [{ id: asinToId.get(asin), asin, rank: index + 1 }] : []));
}
