/**
 * AI 解説が「いまの最新年」で書かれているかを判定する。
 *
 * ai-content.json は生成時の年を `yearCode` に持ち、本文 (FAQ・県別解説) もその年の値で書く。
 * 監査 (auditRow) は本文の形と数値の書き方しか見ないので、取り込みで新しい年が増えても
 * 解説は `done` のまま古い年を語り続ける (2026-10-07 発見。years を e-Stat の実在年に合わせると
 * 新しい年が出る指標が増える)。values.json の最新年と違えば作り直しの対象に戻す。
 *
 * 判定できない (どちらかの年が取れない) ときは何もしない。
 */
export function applyYearFreshness(entry, { contentYear, dataYear }) {
  if (entry.status !== "done") return entry;
  if (!contentYear || !dataYear || String(contentYear) === String(dataYear)) return entry;
  return {
    ...entry,
    status: "needs-regen",
    reason: "stale-year",
    blockers: [],
    contentYear: String(contentYear),
    dataYear: String(dataYear),
  };
}
