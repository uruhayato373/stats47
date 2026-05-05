import "server-only";

import { correlations, getDrizzle } from "@stats47/database/server";

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

export async function upsertCorrelation(
  params: UpsertCorrelationParams
): Promise<void> {
  const db = getDrizzle();
  const calculatedAt = new Date().toISOString();

  const yearX = params.yearX.replace(/年度?$/, "");
  const yearY = params.yearY.replace(/年度?$/, "");
  const scatterDataJson = JSON.stringify(params.scatterData);

  await db
    .insert(correlations)
    .values({
      metricKeyX: params.rankingKeyX,
      metricKeyY: params.rankingKeyY,
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
        correlations.metricKeyX,
        correlations.metricKeyY,
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
