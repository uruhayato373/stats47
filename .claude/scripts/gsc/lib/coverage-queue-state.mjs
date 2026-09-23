export const RESOLVED_BY_INSPECTION = "url-inspection";

export function summarizeCoverageQueue(queue) {
  const byAction = {};
  const byStatus = {};
  const pendingByAction = {};
  const byVerdict = {};
  const byCategory = {};

  for (const entry of queue) {
    byAction[entry.action] = (byAction[entry.action] ?? 0) + 1;
    byStatus[entry.status] = (byStatus[entry.status] ?? 0) + 1;
    byVerdict[entry.verdict] = (byVerdict[entry.verdict] ?? 0) + 1;
    byCategory[entry.gsc_category] = (byCategory[entry.gsc_category] ?? 0) + 1;
    if (entry.status === "pending" && entry.action !== "none") {
      pendingByAction[entry.action] = (pendingByAction[entry.action] ?? 0) + 1;
    }
  }

  return {
    tracked_urls: queue.length,
    pending_actionable: Object.values(pendingByAction).reduce((sum, count) => sum + count, 0),
    by_action: byAction,
    by_status: byStatus,
    indexed_by_inspection: queue.filter(
      (entry) => entry.status === "done" && entry.resolved_by === RESOLVED_BY_INSPECTION
    ).length,
    pending_by_action: pendingByAction,
    by_verdict: byVerdict,
    by_category: byCategory,
  };
}

export function getObserveAfterFixEntries(queue) {
  return queue.filter(
    (entry) =>
      entry.action === "observe-after-fix" &&
      (entry.status === "pending" || entry.status === "in-progress")
  );
}

/** URL Inspection と是正キューで URL の表記を揃える (fragment は検査対象に含まれない)。 */
export function normalizeQueueUrl(raw) {
  try {
    const url = new URL(raw);
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

/**
 * URL Inspection の観測 (URL → 最新の観測) を是正キューへ反映する。
 *
 * キューは毎週 GSC export から作り直されるため、登録された URL は記録を残さず消えていた
 * (2026-09-23 時点で done 0 件)。Google が登録済み (verdict PASS) と返した actionable URL を
 * done にし、是正が効いた件数を数えられるようにする。自動で done にした URL が再び
 * 未登録と観測されたら pending に戻す。人が付けた done / resolved-by-design は触らない。
 */
export function applyInspectionObservations(queue, observations) {
  let observed = 0;
  let indexed = 0;
  let reopened = 0;
  for (const entry of queue) {
    if (entry.action === "none") continue;
    const obs = observations.get(normalizeQueueUrl(entry.url));
    if (!obs) continue;
    observed += 1;
    entry.inspection = {
      observed_at: obs.date,
      verdict: obs.verdict,
      coverage_state: obs.coverageState,
      last_crawl: obs.lastCrawlTime || null,
    };
    const isIndexed = obs.verdict === "PASS";
    if (isIndexed && (entry.status === "pending" || entry.status === "in-progress")) {
      entry.status = "done";
      entry.resolved_at = obs.date;
      entry.resolved_by = RESOLVED_BY_INSPECTION;
      indexed += 1;
    } else if (
      !isIndexed &&
      entry.status === "done" &&
      entry.resolved_by === RESOLVED_BY_INSPECTION
    ) {
      entry.status = "pending";
      entry.resolved_at = null;
      entry.resolved_by = null;
      reopened += 1;
    }
  }
  return { observed, indexed, reopened };
}

/** sitemap 掲載判定用のキー。末尾スラッシュの有無で取りこぼさない。 */
export function sitemapKey(raw) {
  const href = normalizeQueueUrl(raw);
  return href ? href.replace(/\/$/, "") : null;
}

/**
 * sitemap 掲載の有無で HTTP 分類を詰める。inSitemap が null (sitemap を全件取れなかった) なら変えない。
 * - 現在も 404 で sitemap に無い → 古いリンクから Google が覚えているだけの URL。放置が正しい
 *   (2026-09-23 の verify-intent 唯一の pending は `/47` だった)
 * - 現在 200 で未登録なのに sitemap に無い → 載せるか noindex にするかの判断が要る
 *   (observe-after-fix 1,102 件中 105 件。観測を待っても sitemap 外のままでは状況が変わらない)
 */
export function refineBySitemap(cls, inSitemap) {
  if (inSitemap !== false) return cls;
  if (cls.verdict === "still-404") {
    return { verdict: "dead-unlisted", action: "none", design: true };
  }
  if (cls.action === "observe-after-fix") {
    return { verdict: "sitemap-gap", action: "sitemap-gap", design: false };
  }
  return cls;
}

/**
 * バックログカードの対象 URL のうち、まだ処理されていないものを返す。
 * 処理済み = pending でない、かつ done 以外は理由 (note) 付き。キューから消えた URL は
 * GSC の未登録リストに居なくなったので処理済みとして扱う。
 */
export function findUnhandledBatchUrls(queue, urls) {
  const byUrl = new Map(queue.map((entry) => [normalizeQueueUrl(entry.url), entry]));
  return urls.filter((url) => {
    const entry = byUrl.get(normalizeQueueUrl(url));
    if (!entry) return false;
    if (entry.status === "pending") return true;
    if (entry.status === "done") return false;
    return !(entry.note ?? "").trim();
  });
}
