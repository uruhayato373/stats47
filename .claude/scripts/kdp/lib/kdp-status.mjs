export const KDP_OPERATIONAL_STATUSES = ["draft", "in_review", "live", "unknown"];

export function normalizeKdpStatus(label) {
  const value = String(label || "").trim();
  if (value === "下書き" || value === "未作成") return "draft";
  if (/変更.*レビュー中|レビュー中|審査中|出版準備中|公開準備中|処理中/.test(value)) {
    return "in_review";
  }
  if (/販売中|出版済み|ライブ/.test(value)) return "live";
  return "unknown";
}

export function mergeKdpOperationalState(listing, shelf, checkedAt = new Date().toISOString()) {
  const kdpStatusLabel = String(shelf?.status || "不明");
  const kdpStatus = normalizeKdpStatus(kdpStatusLabel);
  const next = {
    ...listing,
    kdpStatus,
    kdpStatusLabel,
    kdpStatusCheckedAt: checkedAt,
  };
  if (shelf?.asin) next.asin = shelf.asin;
  if (kdpStatus !== "draft" && kdpStatus !== "unknown") next.status = "listed";
  if (kdpStatus === "live" && !next.salesStartedAt) {
    next.salesStartedAt = checkedAt.slice(0, 10);
  }
  return next;
}
