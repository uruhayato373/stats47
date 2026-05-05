import "server-only";

import { getDrizzle, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, eq, like, or } from "drizzle-orm";

import type { Observation } from "@stats47/database/server";

/**
 * observations を (metric_key, year_code) で取得する並行 reader
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
      .from(observations)
      .where(
        and(
          eq(observations.metricKey, metricKey),
          or(
            eq(observations.yearCode, yearCode),
            like(observations.yearCode, `${yearCode}%`)
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
