import "server-only";

import { getDrizzle, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, eq, like, or } from "drizzle-orm";

import type { Observation } from "@stats47/database/server";

/**
 * observations を (metric_id, year_code) で取得する並行 reader (PR-3)
 *
 * 旧 listRankingValues の置換候補。PR-5 で呼び出し側を切替。
 *
 * yearCode の柔軟マッチ（"2023" → "2023" or "2023100000"）は旧実装に揃える。
 */
export async function listObservationsByIndicatorAndYear(
  metricId: number,
  yearCode: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Observation[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select()
      .from(observations)
      .where(
        and(
          eq(observations.metricId, metricId),
          or(
            eq(observations.yearCode, yearCode),
            like(observations.yearCode, `${yearCode}%`)
          )
        )
      );

    return ok(rows);
  } catch (error) {
    logger.error(
      { error, metricId, yearCode },
      "listObservationsByIndicatorAndYear: failed"
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
