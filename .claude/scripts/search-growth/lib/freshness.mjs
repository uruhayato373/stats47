/**
 * freshness — 観測の鮮度を決定的に判定する純粋関数。
 *
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md。
 * missing を 0 と混同しない。
 * この module は Date.now を既定に使うが、テスト容易性のため now を注入できる。
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO 文字列 2 つの日数差 (a - b、日)。パース不能なら null。 */
export function daysBetween(aIso, bIso) {
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return (a - b) / DAY_MS;
}

/**
 * 取得時刻の古さから fresh / stale を決める (取得できた前提)。
 * 取得できていない (missing/partial) は collector 側が明示するのでここでは扱わない。
 * @param {{observedAt:string, now?:string|number|Date, staleAfterDays:number}} p
 * @returns {"fresh"|"stale"}
 */
export function classifyAge({ observedAt, now, staleAfterDays }) {
  const nowMs =
    now === undefined ? Date.now() : now instanceof Date ? now.getTime() : typeof now === "number" ? now : Date.parse(now);
  const obsMs = Date.parse(observedAt);
  if (Number.isNaN(obsMs)) return "stale";
  const ageDays = (nowMs - obsMs) / DAY_MS;
  return ageDays <= staleAfterDays ? "fresh" : "stale";
}

/** freshness の悪い順 (missing が最悪)。集約時に「最悪」を取る。 */
const FRESHNESS_RANK = { fresh: 0, stale: 1, partial: 2, missing: 3 };

/** 複数の freshness を集約して最悪値を返す。空配列は "missing"。 */
export function worstFreshness(list) {
  if (!Array.isArray(list) || list.length === 0) return "missing";
  let worst = "fresh";
  for (const f of list) {
    if ((FRESHNESS_RANK[f] ?? 3) > (FRESHNESS_RANK[worst] ?? 0)) worst = f;
  }
  return worst;
}

/**
 * source の実行 status (success/partial/failed/skipped) と最新 snapshot の古さから、
 * その source 由来の Observation に付ける freshness を決める。
 * @param {{status:string, observedAt?:string|null, now?:any, staleAfterDays:number}} p
 * @returns {"fresh"|"stale"|"partial"|"missing"}
 */
export function freshnessForSource({ status, observedAt, now, staleAfterDays }) {
  if (status === "failed" || status === "skipped") return "missing";
  if (!observedAt) return status === "partial" ? "partial" : "missing";
  const age = classifyAge({ observedAt, now, staleAfterDays });
  if (status === "partial") return age === "fresh" ? "partial" : "stale";
  return age;
}

export const FRESHNESS_STALE_DEFAULT_DAYS = Object.freeze({
  gsc: 10, // 週次 + finalized 2日遅延
  inspection: 3,
  sitemap: 8,
  ga4: 10,
  crux: 10,
  psi: 3,
  lighthouse: 30,
  cloudflare: 3,
  http: 2,
  static: 30,
});
