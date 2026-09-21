export function validateWeeklyApproval(decision, { week, id, ownerApproved, commit }) {
  const errors = [];
  if (!commit) errors.push("--commit が必要");
  if (!id) errors.push("--id が必要");
  if (!ownerApproved || ownerApproved !== id) errors.push("--owner-approved には承認対象と同じ書籍IDが必要");
  if (!decision || decision.schemaVersion !== 1) errors.push("週次KDPゲートが不正");
  if (decision?.week !== week) errors.push(`週次KDPゲートの週が不一致: ${decision?.week ?? "none"} != ${week}`);
  if (decision?.status !== "ready-for-owner-approval") {
    errors.push(`週次KDPゲートが公開待ちでない: ${decision?.status ?? "none"}`);
  }
  if (decision?.candidate?.id !== id) {
    errors.push(`週次候補が不一致: ${decision?.candidate?.id ?? "none"} != ${id ?? "none"}`);
  }
  if (decision?.approvalRequired !== true) errors.push("approvalRequired=true でない");
  return { ok: errors.length === 0, errors };
}
