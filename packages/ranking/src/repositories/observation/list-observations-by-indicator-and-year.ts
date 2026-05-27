import "server-only";

import { getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { readStatsValues } from "@stats47/stats-r2";
import { err, ok, type Result } from "@stats47/types";

import type { StatsPrefecture as Observation } from "@stats47/database/server";

/**
 * (metric_key, year_code) の観測値を R2 から取得する。Phase 6 cutover。
 * 戻り型は既存 callers との後方互換のため StatsPrefecture を維持する。
 */
export async function listObservationsByIndicatorAndYear(
  metricKey: string,
  yearCode: string,
  _db?: ReturnType<typeof getDrizzle>,
): Promise<Result<Observation[], Error>> {
  try {
    const payload = await readStatsValues(metricKey, "prefecture");
    if (!payload) return ok([]);
    const rows = payload.rows.filter(
      (r) => String(r.yearCode) === yearCode || String(r.yearCode).startsWith(yearCode),
    );
    const observations: Observation[] = rows.map((r) => ({
      metricKey,
      areaCode: r.areaCode,
      areaName: r.areaName,
      yearCode: String(r.yearCode),
      yearName: r.yearName,
      value: r.value !== null ? Number(r.value) : null,
      unit: r.unit ?? "",
      rank: r.rank ?? null,
      createdAt: null,
    }));
    return ok(observations);
  } catch (error) {
    logger.error(
      { error, metricKey, yearCode },
      "listObservationsByIndicatorAndYear: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
