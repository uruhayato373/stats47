import "server-only";

import { getDrizzle, indicators, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, eq, sql } from "drizzle-orm";
import type { RankingValue } from "../../types";

export async function upsertRankingValues(
  rankingKey: string,
  areaType: string,
  yearCode: string,
  yearName: string | undefined,
  categoryName: string,
  values: RankingValue[],
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<number, Error>> {
  if (values.length === 0) return ok(0);
  try {
    const drizzleDb = db ?? getDrizzle();

    const indicatorRow = await drizzleDb
      .select({ id: indicators.id, unit: indicators.unit })
      .from(indicators)
      .where(
        and(
          eq(indicators.key, rankingKey),
          eq(
            indicators.areaType,
            areaType as "prefecture" | "city" | "national" | "port" | "fishing_port"
          )
        )
      )
      .limit(1);

    if (indicatorRow.length === 0) {
      return err(
        new Error(`indicator not found: key=${rankingKey} areaType=${areaType}`)
      );
    }
    const indicatorId = indicatorRow[0].id;
    const indicatorUnit = indicatorRow[0].unit;

    const entityType = (areaType === "national" ? "prefecture" : areaType) as
      | "prefecture"
      | "city"
      | "port"
      | "fishing_port";

    const rows = values.map((v) => ({
      indicatorId,
      entityType: (v.areaType === "national"
        ? "prefecture"
        : v.areaType ?? entityType) as
        | "prefecture"
        | "city"
        | "port"
        | "fishing_port",
      entityCode: v.areaCode,
      yearCode: v.yearCode ?? yearCode,
      yearName: v.yearName ?? yearName ?? null,
      entityName: v.areaName,
      categoryName: v.categoryName ?? categoryName,
      valueNumeric: v.value,
      unit: v.unit ?? indicatorUnit ?? null,
      rank: typeof v.rank === "number" ? v.rank : null,
    }));

    await drizzleDb
      .insert(observations)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          observations.indicatorId,
          observations.entityType,
          observations.entityCode,
          observations.yearCode,
        ],
        set: {
          entityName: sql.raw("excluded.entity_name"),
          yearName: sql.raw("excluded.year_name"),
          categoryName: sql.raw("excluded.category_name"),
          valueNumeric: sql.raw("excluded.value_numeric"),
          unit: sql.raw("excluded.unit"),
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
