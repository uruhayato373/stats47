import { advancePublicationStage, stageForKdpStatus } from "./kdp-publication-stage.mjs";

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

/**
 * 台帳の kuEnrolled と、価格画面の「KDP セレクトに本を登録する」の状態が食い違う理由を返す (一致なら null)。
 * 台帳が未登録で画面が登録ありの向きも止める。2026-11-13 に K-S1-05 がこの向きで食い違い、
 * 台帳が登録ありの本しか画面を読まない検査では検出できなかった。画面から読めないときも一致と言わない。
 */
export function kdpSelectMismatch(ledgerEnrolled, screenChecked) {
  if (screenChecked !== true && screenChecked !== false) return "KDP セレクトの状態を画面から読めない";
  if (ledgerEnrolled === true && !screenChecked) return "KDP セレクトが未登録 (台帳は登録あり)";
  if (ledgerEnrolled !== true && screenChecked) return "KDP セレクトに登録されている (台帳は未登録)";
  return null;
}

export function mergeKdpOperationalState(listing, shelf, checkedAt = new Date().toISOString()) {
  const kdpStatusLabel = String(shelf?.status || "不明");
  const kdpStatus = normalizeKdpStatus(kdpStatusLabel);
  let next = {
    ...listing,
    kdpStatus,
    kdpStatusLabel,
    kdpStatusCheckedAt: checkedAt,
  };
  if (shelf?.asin) next.asin = shelf.asin;
  // withdrawn は「売らない」と決めた記録。出版停止の処理待ちで本棚がまだ live でも listed に戻さない (2026-10-27)
  if (kdpStatus !== "draft" && kdpStatus !== "unknown" && listing.status !== "withdrawn") next.status = "listed";
  if (kdpStatus === "live" && !next.salesStartedAt) {
    next.salesStartedAt = checkedAt.slice(0, 10);
  }
  const nextStage = stageForKdpStatus(next, kdpStatus);
  if (nextStage) next = advancePublicationStage(next, nextStage, checkedAt, { statusLabel: kdpStatusLabel, asin: shelf?.asin || next.asin || null });
  return next;
}
