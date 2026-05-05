import "server-only";

import { correlations, getDrizzle, metrics } from "@stats47/database/server";
import { aliasedTable, asc, desc, eq, sql } from "drizzle-orm";

export interface ListCorrelationAnalysisOptions {
  limit?: number;
  offset?: number;
  orderBy?: "pearsonR_asc" | "pearsonR_desc" | "calculatedAt_desc";
}

export interface CorrelationAnalysisWithTitles {
  id: number;
  rankingKeyX: string;
  rankingKeyY: string;
  yearX: string;
  yearY: string;
  pearsonR: number;
  partialRPopulation: number | null;
  partialRArea: number | null;
  partialRAging: number | null;
  partialRDensity: number | null;
  scatterData: string;
  calculatedAt: string;
  titleX: string | null;
  titleY: string | null;
}

export async function listCorrelationAnalysis(
  options?: ListCorrelationAnalysisOptions
): Promise<CorrelationAnalysisWithTitles[]> {
  const db = getDrizzle();
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const orderByColumn =
    options?.orderBy === "pearsonR_asc"
      ? asc(correlations.pearsonR)
      : options?.orderBy === "pearsonR_desc"
        ? desc(correlations.pearsonR)
        : desc(correlations.calculatedAt);

  const ix = aliasedTable(metrics, "ix");
  const iy = aliasedTable(metrics, "iy");

  const rows = await db
    .select({
      id: correlations.id,
      rankingKeyX: correlations.metricKeyX,
      rankingKeyY: correlations.metricKeyY,
      yearX: correlations.yearX,
      yearY: correlations.yearY,
      pearsonR: correlations.pearsonR,
      partialRPopulation: correlations.partialRPopulation,
      partialRArea: correlations.partialRArea,
      partialRAging: correlations.partialRAging,
      partialRDensity: correlations.partialRDensity,
      scatterData: correlations.scatterDataJson,
      calculatedAt: correlations.calculatedAt,
      titleX: sql<string | null>`${ix.title}`,
      titleY: sql<string | null>`${iy.title}`,
    })
    .from(correlations)
    .innerJoin(ix, eq(correlations.metricKeyX, ix.key))
    .innerJoin(iy, eq(correlations.metricKeyY, iy.key))
    .orderBy(orderByColumn)
    .limit(limit)
    .offset(offset);

  return rows;
}
