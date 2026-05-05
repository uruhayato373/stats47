import "server-only";

import { correlations, getDrizzle, metrics } from "@stats47/database/server";
import { aliasedTable, asc, desc, eq, sql } from "drizzle-orm";

export interface ListCorrelationAnalysisOptions {
  limit?: number;
  offset?: number;
  orderBy?: "pearsonR_asc" | "pearsonR_desc" | "calculatedAt_desc";
}

/** 相関分析結果 + ランキングタイトル (旧 CorrelationAnalysisWithTitles 型と互換) */
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

/**
 * 相関分析結果の一覧を取得 (PR-5: 新 correlations 経由 + metrics JOIN)
 */
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
      rankingKeyX: ix.key,
      rankingKeyY: iy.key,
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
    .innerJoin(ix, eq(correlations.metricXId, ix.id))
    .innerJoin(iy, eq(correlations.metricYId, iy.id))
    .orderBy(orderByColumn)
    .limit(limit)
    .offset(offset);

  return rows;
}
