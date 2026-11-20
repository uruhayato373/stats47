/**
 * 図に描いた年が、その指標の最新年より古い公開記事を見つける純粋関数。
 *
 * ブログの本文・図・data JSON は書いた時点の年のまま固定される (fetch-ranking-data-r2.mjs)。
 * 一方、本文中の `<source-link>` カードは最新年を出す (/api/ranking-card)。新しい年が取り込まれると
 * 1 本の記事に 2 つの年が並び、図の数値も古くなる。どの記事のどの図が古いかを、blog snapshot の
 * `rankingRefs` (記事が使う指標と図の年) と ranking item の `latestYear` を突き合わせて出す。
 *
 * 年を持たない参照 (本文のリンクだけの指標) と、最新年が分からない指標は判定しない。
 */
export function findStaleDataYears(articles, latestYearByKey) {
  const out = [];
  for (const article of articles) {
    if (article.published !== true) continue;
    const stale = [];
    for (const ref of article.rankingRefs ?? []) {
      const latest = latestYearByKey.get(ref.rankingKey);
      if (!ref.year || !latest || ref.year >= latest) continue;
      stale.push({ rankingKey: ref.rankingKey, articleYear: ref.year, latestYear: latest });
    }
    if (stale.length > 0) out.push({ slug: article.slug, title: article.title, stale });
  }
  return out.sort(
    (a, b) =>
      maxLag(b.stale) - maxLag(a.stale) || a.slug.localeCompare(b.slug),
  );
}

function maxLag(stale) {
  return Math.max(...stale.map((s) => Number(s.latestYear) - Number(s.articleYear)));
}
