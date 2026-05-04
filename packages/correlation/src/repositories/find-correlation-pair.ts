import "server-only";

import { correlations, getDrizzle, indicators } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, eq, inArray, or } from "drizzle-orm";

export async function findCorrelationPair(
  rankingKeyX: string,
  rankingKeyY: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<
  Result<{
    pearsonR: number;
    partialRPopulation: number | null;
    partialRArea: number | null;
    partialRAging: number | null;
    partialRDensity: number | null;
    scatterData: Array<{ areaCode: string; areaName: string; x: number; y: number }>;
  } | null, Error>
> {
  try {
    const drizzleDb = db ?? getDrizzle();

    const indRows = await drizzleDb
      .select({ id: indicators.id, key: indicators.key })
      .from(indicators)
      .where(
        and(
          inArray(indicators.key, [rankingKeyX, rankingKeyY]),
          eq(indicators.areaType, "prefecture")
        )
      );
    const idByKey = new Map(indRows.map((r) => [r.key, r.id]));
    const xId = idByKey.get(rankingKeyX);
    const yId = idByKey.get(rankingKeyY);
    if (!xId || !yId) return ok(null);

    const rows = await drizzleDb
      .select({
        indicatorXId: correlations.indicatorXId,
        indicatorYId: correlations.indicatorYId,
        pearsonR: correlations.pearsonR,
        partialRPopulation: correlations.partialRPopulation,
        partialRArea: correlations.partialRArea,
        partialRAging: correlations.partialRAging,
        partialRDensity: correlations.partialRDensity,
        scatterData: correlations.scatterDataJson,
      })
      .from(correlations)
      .where(
        or(
          and(eq(correlations.indicatorXId, xId), eq(correlations.indicatorYId, yId)),
          and(eq(correlations.indicatorXId, yId), eq(correlations.indicatorYId, xId))
        )
      )
      .limit(1);

    if (rows.length === 0) return ok(null);

    const row = rows[0];
    let scatter: Array<{ areaCode: string; areaName: string; x: number; y: number }>;
    try {
      const parsed = JSON.parse(row.scatterData);
      if (row.indicatorXId === xId) {
        scatter = parsed;
      } else {
        scatter = parsed.map((p: { areaCode: string; areaName: string; x: number; y: number }) => ({
          areaCode: p.areaCode,
          areaName: p.areaName,
          x: p.y,
          y: p.x,
        }));
      }
    } catch {
      scatter = [];
    }

    return ok({
      pearsonR: row.pearsonR,
      partialRPopulation: row.partialRPopulation,
      partialRArea: row.partialRArea,
      partialRAging: row.partialRAging,
      partialRDensity: row.partialRDensity,
      scatterData: scatter,
    });
  } catch (error) {
    logger.error({ error, rankingKeyX, rankingKeyY }, "findCorrelationPair: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
