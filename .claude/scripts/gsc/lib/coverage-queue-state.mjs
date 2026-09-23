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
