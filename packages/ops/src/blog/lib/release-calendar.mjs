/**
 * 統計の公表暦 (カタログの surveys.release-calendar) から、公表済みなのに古い年のまま残っている
 * 公開記事を見つける純粋関数。
 *
 * stale-data-years.mjs は「サイトに取り込んだ最新年」と記事の図の年を比べるので、公表されたのに指標の取り込みが
 * 遅れている年 (家計調査の 2025 年分など) は見えない。公表暦は調査ごとに「データの年 N が、N + lagYears 年の
 * month 月に公表される」を持つ。公表日が月のどこかは分からないので、公表月の翌月 1 日から公表済みとみなす。
 *
 * 指標 → 調査は ranking item の surveyIds (主出典) で引く。調査が 1 つでも公表暦に無い指標と、調査の分からない
 * 指標は判定しない (古いと決めつけない)。複数の調査を継いだ系列 (国勢調査と人口推計) は新しい方の年まで公表済み。
 */

const MAX_LOOKBACK_YEARS = 12;

/** "YYYY-MM-DD" の時点で、公表暦の 1 調査が公表を終えた最新のデータの年。分からなければ null。 */
export function latestReleasedDataYear(entry, asOf) {
  const [asOfYear, asOfMonth] = asOf.split("-").map(Number);
  const asOfIndex = asOfYear * 12 + (asOfMonth - 1);
  for (let year = asOfYear; year >= asOfYear - MAX_LOOKBACK_YEARS; year--) {
    if (entry.everyYears && (year - entry.anchorYear) % entry.everyYears !== 0) continue;
    if (entry.skipEveryYears && (year - entry.skipAnchorYear) % entry.skipEveryYears === 0) continue;
    // 公表月の翌月 (0 始まりの月番号で month) の 1 日から公表済み
    const releasedFromIndex = (year + entry.lagYears) * 12 + entry.month;
    if (asOfIndex >= releasedFromIndex) return year;
  }
  return null;
}

/**
 * @param {Array<{slug: string, title?: string, published?: boolean, rankingRefs?: Array<{rankingKey: string, year?: string}>}>} articles
 * @param {{ asOf: string, calendar: Array<object>, latestYearByKey: Map<string, string>, surveyIdsByKey: Map<string, string[]> }} ctx
 */
export function findReleaseDue(articles, { asOf, calendar, latestYearByKey, surveyIdsByKey }) {
  const releasedBySurvey = new Map(calendar.map((entry) => [entry.surveyId, latestReleasedDataYear(entry, asOf)]));
  const out = [];
  for (const article of articles) {
    if (article.published !== true) continue;
    const due = [];
    for (const ref of article.rankingRefs ?? []) {
      if (!/^\d{4}$/.test(ref.year ?? "")) continue;
      const surveyIds = surveyIdsByKey.get(ref.rankingKey) ?? [];
      if (surveyIds.length === 0 || !surveyIds.every((id) => releasedBySurvey.get(id) != null)) continue;
      const releasedYear = Math.max(...surveyIds.map((id) => releasedBySurvey.get(id)));
      if (Number(ref.year) >= releasedYear) continue;
      const siteLatestYear = latestYearByKey.get(ref.rankingKey) ?? null;
      due.push({
        rankingKey: ref.rankingKey,
        surveyIds,
        articleYear: ref.year,
        siteLatestYear,
        releasedYear: String(releasedYear),
        // 指標がまだ公表済みの年を取り込んでいなければ、記事より先に指標の年次更新が要る
        action: siteLatestYear != null && Number(siteLatestYear) >= releasedYear ? "refresh-article" : "ingest-metric",
      });
    }
    if (due.length > 0) out.push({ slug: article.slug, title: article.title, due: due.sort(byLag) });
  }
  return out.sort((a, b) => maxLag(b.due) - maxLag(a.due) || a.slug.localeCompare(b.slug));
}

function lag(d) {
  return Number(d.releasedYear) - Number(d.articleYear);
}

function byLag(a, b) {
  return lag(b) - lag(a) || a.rankingKey.localeCompare(b.rankingKey);
}

function maxLag(due) {
  return Math.max(...due.map(lag));
}
