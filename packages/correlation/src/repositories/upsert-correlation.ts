import "server-only";

import {
  correlationAnalysis,
  getDrizzle,
  type InsertCorrelationAnalysis,
} from "@stats47/database/server";
import type { ScatterDataPoint } from "../utils/calculate-pearson";

export interface UpsertCorrelationParams {
  rankingKeyX: string;
  rankingKeyY: string;
  yearX: string;
  yearY: string;
  pearsonR: number;
  partialRPopulation: number | null;
  partialRArea: number | null;
  partialRAging: number | null;
  partialRDensity: number | null;
  scatterData: ScatterDataPoint[];
}

/**
 * 相関分析結果を1件 upsert する
 * 一意制約: rankingKeyX + rankingKeyY + yearX + yearY
 */
export async function upsertCorrelation(
  params: UpsertCorrelationParams
): Promise<void> {
  const db = getDrizzle();
  const calculatedAt = new Date().toISOString();
  const row: InsertCorrelationAnalysis = {
    rankingKeyX: params.rankingKeyX,
    rankingKeyY: params.rankingKeyY,
    yearX: params.yearX.replace(/年度?$/, ""),
    yearY: params.yearY.replace(/年度?$/, ""),
    pearsonR: params.pearsonR,
    partialRPopulation: params.partialRPopulation,
    partialRArea: params.partialRArea,
    partialRAging: params.partialRAging,
    partialRDensity: params.partialRDensity,
    scatterData: JSON.stringify(params.scatterData),
    calculatedAt,
  };

  await db
    .insert(correlationAnalysis)
    .values(row)
    .onConflictDoUpdate({
      target: [
        correlationAnalysis.rankingKeyX,
        correlationAnalysis.rankingKeyY,
        correlationAnalysis.yearX,
        correlationAnalysis.yearY,
      ],
      set: {
        pearsonR: row.pearsonR,
        partialRPopulation: row.partialRPopulation,
        partialRArea: row.partialRArea,
        partialRAging: row.partialRAging,
        partialRDensity: row.partialRDensity,
        scatterData: row.scatterData,
        calculatedAt: row.calculatedAt,
      },
    });
}
