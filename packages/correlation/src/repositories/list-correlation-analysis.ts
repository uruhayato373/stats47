import "server-only";

import {
  correlationAnalysis,
  getDrizzle,
  rankingItems,
  type CorrelationAnalysis,
} from "@stats47/database/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";

export interface ListCorrelationAnalysisOptions {
  limit?: number;
  offset?: number;
  orderBy?: "pearsonR_asc" | "pearsonR_desc" | "calculatedAt_desc";
}

/** 相関分析結果 + ランキングタイトル */
export interface CorrelationAnalysisWithTitles extends CorrelationAnalysis {
  titleX: string | null;
  titleY: string | null;
}

/**
 * 相関分析結果の一覧を取得する（ランキングタイトル付き）
 */
export async function listCorrelationAnalysis(
  options?: ListCorrelationAnalysisOptions
): Promise<CorrelationAnalysisWithTitles[]> {
  const db = getDrizzle();
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const orderByColumn =
    options?.orderBy === "pearsonR_asc"
      ? asc(correlationAnalysis.pearsonR)
      : options?.orderBy === "pearsonR_desc"
        ? desc(correlationAnalysis.pearsonR)
        : desc(correlationAnalysis.calculatedAt);

  // ranking_items を X/Y それぞれ LEFT JOIN してタイトルを取得
  const riX = db
    .select({
      rankingKey: rankingItems.rankingKey,
      title: rankingItems.title,
    })
    .from(rankingItems)
    .where(eq(rankingItems.areaType, "prefecture"))
    .as("ri_x");

  const riY = db
    .select({
      rankingKey: rankingItems.rankingKey,
      title: rankingItems.title,
    })
    .from(rankingItems)
    .where(eq(rankingItems.areaType, "prefecture"))
    .as("ri_y");

  const rows = await db
    .select({
      id: correlationAnalysis.id,
      rankingKeyX: correlationAnalysis.rankingKeyX,
      rankingKeyY: correlationAnalysis.rankingKeyY,
      yearX: correlationAnalysis.yearX,
      yearY: correlationAnalysis.yearY,
      pearsonR: correlationAnalysis.pearsonR,
      partialRPopulation: correlationAnalysis.partialRPopulation,
      partialRArea: correlationAnalysis.partialRArea,
      partialRAging: correlationAnalysis.partialRAging,
      partialRDensity: correlationAnalysis.partialRDensity,
      scatterData: correlationAnalysis.scatterData,
      calculatedAt: correlationAnalysis.calculatedAt,
      titleX: sql<string | null>`${riX.title}`,
      titleY: sql<string | null>`${riY.title}`,
    })
    .from(correlationAnalysis)
    .leftJoin(riX, eq(correlationAnalysis.rankingKeyX, riX.rankingKey))
    .leftJoin(riY, eq(correlationAnalysis.rankingKeyY, riY.rankingKey))
    .orderBy(orderByColumn)
    .limit(limit)
    .offset(offset);

  return rows;
}
