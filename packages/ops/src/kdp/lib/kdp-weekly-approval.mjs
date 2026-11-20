/**
 * 週次 KDP ゲート (data/products/kdp-weekly-publication.json) と、対象 ID のオーナー承認を照合する。
 * 2026-11-14 から検証済みの本は複数あってよく、承認は 1 冊ずつ受け付ける (eligibleCandidateIds の中の ID だけ)。
 */
export function validateWeeklyApproval(decision, { week, id, ownerApproved, commit }) {
  const errors = [];
  if (!commit) errors.push("--commit が必要");
  if (!id) errors.push("--id が必要");
  if (!ownerApproved || ownerApproved !== id) errors.push("--owner-approved には承認対象と同じ書籍IDが必要");
  if (!decision || decision.schemaVersion !== 2) errors.push("週次KDPゲートが不正");
  if (decision?.week !== week) errors.push(`週次KDPゲートの週が不一致: ${decision?.week ?? "none"} != ${week}`);
  if (decision?.status !== "ready-for-owner-approval") {
    errors.push(`週次KDPゲートが公開待ちでない: ${decision?.status ?? "none"}`);
  }
  const eligible = Array.isArray(decision?.eligibleCandidateIds) ? decision.eligibleCandidateIds : [];
  if (!id || !eligible.includes(id)) {
    errors.push(`検証済みの候補に無い: ${id ?? "none"} (候補: ${eligible.join(", ") || "none"})`);
  }
  if (decision?.approvalRequired !== true) errors.push("approvalRequired=true でない");
  return { ok: errors.length === 0, errors };
}
