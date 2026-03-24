import "server-only";

import { correlationAnalysis, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, eq, or } from "drizzle-orm";

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
    const rows = await drizzleDb
      .select({
        rankingKeyX: correlationAnalysis.rankingKeyX,
        rankingKeyY: correlationAnalysis.rankingKeyY,
        pearsonR: correlationAnalysis.pearsonR,
        partialRPopulation: correlationAnalysis.partialRPopulation,
        partialRArea: correlationAnalysis.partialRArea,
        partialRAging: correlationAnalysis.partialRAging,
        partialRDensity: correlationAnalysis.partialRDensity,
        scatterData: correlationAnalysis.scatterData,
      })
      .from(correlationAnalysis)
      .where(
        or(
          and(
            eq(correlationAnalysis.rankingKeyX, rankingKeyX),
            eq(correlationAnalysis.rankingKeyY, rankingKeyY)
          ),
          and(
            eq(correlationAnalysis.rankingKeyX, rankingKeyY),
            eq(correlationAnalysis.rankingKeyY, rankingKeyX)
          )
        )
      )
      .limit(1);

    if (rows.length === 0) return ok(null);

    const row = rows[0];
    let scatter: Array<{ areaCode: string; areaName: string; x: number; y: number }>;
    try {
      const parsed = JSON.parse(row.scatterData);
      if (row.rankingKeyX === rankingKeyX) {
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
