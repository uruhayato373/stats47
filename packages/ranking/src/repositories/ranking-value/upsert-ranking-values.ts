import "server-only";

import { getDrizzle, metrics, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, eq, sql } from "drizzle-orm";
import type { RankingValue } from "../../types";

export async function upsertRankingValues(
  rankingKey: string,
  areaType: string,
  yearCode: string,
  values: RankingValue[],
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<number, Error>> {
  if (values.length === 0) return ok(0);
  try {
    const drizzleDb = db ?? getDrizzle();

    const indicatorRow = await drizzleDb
      .select({ id: metrics.id })
      .from(metrics)
      .where(
        and(
          eq(metrics.key, rankingKey),
          eq(
            metrics.areaType,
            areaType as "prefecture" | "city" | "national" | "port" | "fishing_port"
          )
        )
      )
      .limit(1);

    if (indicatorRow.length === 0) {
      return err(
        new Error(`metric not found: key=${rankingKey} areaType=${areaType}`)
      );
    }
    const metricId = indicatorRow[0].id;

    const entityType = (areaType === "national" ? "prefecture" : areaType) as
      | "prefecture"
      | "city"
      | "port"
      | "fishing_port";

    const rows = values.map((v) => ({
      metricId,
      areaType: (v.areaType === "national"
        ? "prefecture"
        : v.areaType ?? entityType) as
        | "prefecture"
        | "city"
        | "port"
        | "fishing_port",
      areaCode: v.areaCode,
      yearCode: v.yearCode ?? yearCode,
      value: v.value,
      rank: typeof v.rank === "number" ? v.rank : null,
    }));

    await drizzleDb
      .insert(observations)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          observations.metricId,
          observations.areaType,
          observations.areaCode,
          observations.yearCode,
        ],
        set: {
          value: sql.raw("excluded.value"),
          rank: sql.raw("excluded.rank"),
        },
      });

    logger.debug(
      { rankingKey, areaType, yearCode, count: values.length },
      "upsertRankingValues: 完了"
    );
    return ok(values.length);
  } catch (error) {
    logger.error({ error, rankingKey, areaType, yearCode }, "upsertRankingValues: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
