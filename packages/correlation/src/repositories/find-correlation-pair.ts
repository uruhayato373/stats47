import "server-only";

import { correlations, getDrizzle, metrics } from "@stats47/database/server";
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
      .select({ id: metrics.id, key: metrics.key })
      .from(metrics)
      .where(inArray(metrics.key, [rankingKeyX, rankingKeyY]));
    const idByKey = new Map(indRows.map((r) => [r.key, r.id]));
    const xId = idByKey.get(rankingKeyX);
    const yId = idByKey.get(rankingKeyY);
    if (!xId || !yId) return ok(null);

    const rows = await drizzleDb
      .select({
        metricXId: correlations.metricXId,
        metricYId: correlations.metricYId,
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
          and(eq(correlations.metricXId, xId), eq(correlations.metricYId, yId)),
          and(eq(correlations.metricXId, yId), eq(correlations.metricYId, xId))
        )
      )
      .limit(1);

    if (rows.length === 0) return ok(null);

    const row = rows[0];
    let scatter: Array<{ areaCode: string; areaName: string; x: number; y: number }>;
    try {
      const parsed = JSON.parse(row.scatterData);
      if (row.metricXId === xId) {
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
