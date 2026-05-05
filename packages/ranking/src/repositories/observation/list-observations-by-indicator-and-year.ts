import "server-only";

import { getDrizzle, stats } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, eq, like, or } from "drizzle-orm";

import type { Observation } from "@stats47/database/server";

/**
 * stats を (metric_key, year_code) で取得する並行 reader
 */
export async function listObservationsByIndicatorAndYear(
  metricKey: string,
  yearCode: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Observation[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select()
      .from(stats)
      .where(
        and(
          eq(stats.metricKey, metricKey),
          or(
            eq(stats.yearCode, yearCode),
            like(stats.yearCode, `${yearCode}%`)
          ),
        )
      );

    return ok(rows);
  } catch (error) {
    logger.error(
      { error, metricKey, yearCode },
      "listObservationsByIndicatorAndYear: failed"
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
