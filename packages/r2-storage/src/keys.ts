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
  "ai-content",
  "page-cards",
  "values-per-household",
  "thumbnail",
  "ogp-image",
  "ogp-generation",
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
  const filename = kind === "ogp-image" ? "ogp/ogp.png"
    : kind === "ogp-generation" ? "ogp/generation.json" : `${kind}.json`;
  return `${RANKING_R2_PREFIX}/${rankingKey}/${filename}`;
}

/** Observation entities; kept independent of data-configs for scripts and Workers. */
export type StatsR2EntityKind = "prefecture" | "city" | "port" | "migration-flow";

export function statsR2Key(
  metricKey: string,
  entityKind: StatsR2EntityKind,
  year?: number,
): string {
  switch (entityKind) {
    case "prefecture":
      return `${STATS_R2_PREFIX}/${metricKey}/values.json`;
    case "city":
      return `${STATS_R2_PREFIX}/${metricKey}/cities.json`;
    case "port":
      return `${STATS_R2_PREFIX}/${metricKey}/ports.json`;
    case "migration-flow":
      if (year == null)
        throw new Error("migration-flow requires year parameter");
      return `${STATS_R2_PREFIX}/${metricKey}/migration-flow-${year}.json`;
    default: {
      const _exhaustive: never = entityKind;
      throw new Error(`unknown entity kind: ${_exhaustive}`);
    }
  }
}
