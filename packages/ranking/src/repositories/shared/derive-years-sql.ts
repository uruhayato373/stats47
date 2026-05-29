import "server-only";

import { sql, type SQL } from "drizzle-orm";

/**
 * 旧実装: stats_prefecture から MAX(year_code) / DISTINCT(year_code) を動的計算する SQL fragment。
 *
 * Phase 7 (2026-05-28): D1 stats_* テーブル削除に伴い、SQL では NULL を返し、
 * latestYear / availableYears は `parse-metric-as-ranking-item.ts` で
 * TS-config 由来 (`getMetricMeta(key)`) から JS で enrichment する方針に変更。
 *
 * 互換性のため SQL fragment 自体は残置 (metricAsRankingItemSelection の SELECT 列に紐づくため)。
 */
export const latestYearSql: SQL<null> = sql<null>`NULL`;

export const availableYearsSql: SQL<null> = sql<null>`NULL`;
