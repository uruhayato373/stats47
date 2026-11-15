import SITE from "../../types/src/site.json";

/** Metric observation and ranking snapshot namespaces. Safe in scripts and Workers. */
export const STATS_R2_PREFIX = "app/stats";
export const RANKING_R2_PREFIX = "app/ranking";
export const R2_PUBLIC_ORIGIN = SITE.r2PublicBaseUrl;

const RANKING_KINDS = [
  "item",
  "values",
  "values-per-population",
  "values-per-area",
  "national-trend",
] as const;

export type RankingR2Kind = (typeof RANKING_KINDS)[number];

export function rankingR2Key(rankingKey: string, kind: RankingR2Kind): string {
  if (typeof rankingKey !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rankingKey)) {
    throw new Error(`Invalid ranking key segment: ${rankingKey}`);
  }
  // Plain-node callers do not have the TypeScript union guard.
  if (!RANKING_KINDS.includes(kind)) {
    throw new Error(`Invalid ranking R2 kind: ${kind}`);
  }
  return `${RANKING_R2_PREFIX}/${rankingKey}/${kind}.json`;
}
