export function summarizeCoverageQueue(queue) {
  const byAction = {};
  const pendingByAction = {};
  const byVerdict = {};
  const byCategory = {};

  for (const entry of queue) {
    byAction[entry.action] = (byAction[entry.action] ?? 0) + 1;
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
