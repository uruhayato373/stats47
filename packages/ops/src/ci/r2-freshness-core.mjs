/**
 * 配信データ (R2 snapshot) の鮮度判定 (純粋関数)。
 *
 * ★なぜ job の成否と別に要るか (2026-08-13)
 * 楽天カタログ同期は 9 日間失敗し続けたが、**ジョブが緑でも同じ被害は起きうる**。
 * 「例外は出ていないが 0 件書いた」「push ステップに到達しなかった」は成否では
 * 見えず、配信データの generatedAt を見て初めて分かる。逆にここが新しければ、
 * ジョブが多少荒れていても読者に届くものは正しい。
 */

/** 判定に使う 1 件の観測 */
export function classifyEntry(entry, nowMs) {
  if (entry.error) return { ...entry, status: "error", ageDays: null };
  if (!entry.generatedAt) return { ...entry, status: "no-timestamp", ageDays: null };
  const at = Date.parse(entry.generatedAt);
  if (!Number.isFinite(at)) return { ...entry, status: "no-timestamp", ageDays: null };
  // 未来日時は時計ずれか壊れた書き込み。新しすぎるものを「健全」と言い切らない。
  const ageDays = (nowMs - at) / 86400000;
  if (ageDays < -1) return { ...entry, status: "future", ageDays };
  return {
    ...entry,
    ageDays,
    status: ageDays > entry.maxAgeDays ? "stale" : "fresh",
  };
}

/** 問題扱いにする status (fresh 以外はすべて。「読めなかった」を健全と混同しない) */
const PROBLEM = new Set(["stale", "error", "no-timestamp", "future"]);

export function evaluateFreshness(entries, nowMs) {
  const results = entries.map((e) => classifyEntry(e, nowMs));
  const problems = results
    .filter((r) => PROBLEM.has(r.status))
    .sort((a, b) => (b.ageDays ?? Infinity) - (a.ageDays ?? Infinity));
  return { results, problems, checked: results.length };
}

export function formatFreshnessReport(summary) {
  const lines = [`配信 snapshot ${summary.checked} 件の鮮度を検査`];
  if (summary.problems.length === 0) {
    lines.push("全て許容期間内。");
    return lines.join("\n");
  }
  lines.push("", `⚠️ 問題 ${summary.problems.length} 件:`);
  for (const r of summary.problems) {
    const age = r.ageDays === null ? "?" : r.ageDays.toFixed(1);
    const label = {
      stale: `${age} 日前 (上限 ${r.maxAgeDays} 日)`,
      error: `取得失敗: ${r.error}`,
      "no-timestamp": "generatedAt が無い / 壊れている",
      future: `generatedAt が未来 (${age} 日)`,
    }[r.status];
    lines.push(`- ${r.key}: ${label}`);
    if (r.why) lines.push(`    ${r.why}`);
  }
  return lines.join("\n");
}
