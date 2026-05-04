import "server-only";

import { correlations, getDrizzle, metrics } from "@stats47/database/server";
import { and, eq, inArray } from "drizzle-orm";

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
 * 相関分析結果を 1 件 upsert する (PR-5: 新 correlations 経由)
 *
 * 入力は旧 (rankingKeyX, rankingKeyY) ベース。metrics (prefecture) を
 * ルックアップして metric_id を取得し、新 correlations に UPSERT する。
 * UNIQUE: (metric_x_id, metric_y_id, year_x, year_y)
 */
export async function upsertCorrelation(
  params: UpsertCorrelationParams
): Promise<void> {
  const db = getDrizzle();
  const calculatedAt = new Date().toISOString();

  const indRows = await db
    .select({ id: metrics.id, key: metrics.key })
    .from(metrics)
    .where(
      and(
        inArray(metrics.key, [params.rankingKeyX, params.rankingKeyY]),
        eq(metrics.areaType, "prefecture")
      )
    );
  const idByKey = new Map(indRows.map((r) => [r.key, r.id]));
  const xId = idByKey.get(params.rankingKeyX);
  const yId = idByKey.get(params.rankingKeyY);
  if (!xId || !yId) {
    throw new Error(
      `upsertCorrelation: indicator not found for (${params.rankingKeyX} or ${params.rankingKeyY})`
    );
  }

  const yearX = params.yearX.replace(/年度?$/, "");
  const yearY = params.yearY.replace(/年度?$/, "");
  const scatterDataJson = JSON.stringify(params.scatterData);

  await db
    .insert(correlations)
    .values({
      metricXId: xId,
      metricYId: yId,
      yearX,
      yearY,
      pearsonR: params.pearsonR,
      partialRPopulation: params.partialRPopulation,
      partialRArea: params.partialRArea,
      partialRAging: params.partialRAging,
      partialRDensity: params.partialRDensity,
      scatterDataJson,
      calculatedAt,
    })
    .onConflictDoUpdate({
      target: [
        correlations.metricXId,
        correlations.metricYId,
        correlations.yearX,
        correlations.yearY,
      ],
      set: {
        pearsonR: params.pearsonR,
        partialRPopulation: params.partialRPopulation,
        partialRArea: params.partialRArea,
        partialRAging: params.partialRAging,
        partialRDensity: params.partialRDensity,
        scatterDataJson,
        calculatedAt,
      },
    });
}
