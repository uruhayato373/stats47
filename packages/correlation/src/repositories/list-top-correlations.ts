import "server-only";

import {
  correlations,
  getDrizzle,
  indicators,
} from "@stats47/database/server";
import { aliasedTable, and, eq, sql } from "drizzle-orm";
import {
  isExcludedCorrelationKey,
  isExcludedCorrelationPair,
} from "../trivial-pairs";

export interface TopCorrelation {
  rankingKeyX: string;
  rankingKeyY: string;
  titleX: string | null;
  titleY: string | null;
  normalizationBasisX: string | null;
  normalizationBasisY: string | null;
  pearsonR: number;
  effectiveR: number;
  partialRPopulation: number | null;
  partialRArea: number | null;
  partialRAging: number | null;
  partialRDensity: number | null;
}

/**
 * 相関係数の絶対値が高い上位 N 件を取得する (PR-5: 新 correlations 経由)
 */
export async function listTopCorrelations(
  limit = 20,
  db?: ReturnType<typeof getDrizzle>
): Promise<TopCorrelation[]> {
  const d = db ?? getDrizzle();

  const ix = aliasedTable(indicators, "ix");
  const iy = aliasedTable(indicators, "iy");

  const effectiveAbsR = sql<number>`MIN(
    COALESCE(ABS(${correlations.partialRPopulation}), ABS(${correlations.pearsonR})),
    COALESCE(ABS(${correlations.partialRArea}), ABS(${correlations.pearsonR})),
    COALESCE(ABS(${correlations.partialRAging}), ABS(${correlations.pearsonR})),
    COALESCE(ABS(${correlations.partialRDensity}), ABS(${correlations.pearsonR}))
  )`;

  const rows = await d
    .select({
      rankingKeyX: ix.key,
      rankingKeyY: iy.key,
      pearsonR: correlations.pearsonR,
      effectiveR: sql<number>`CASE WHEN ${correlations.pearsonR} >= 0 THEN 1 ELSE -1 END * ${effectiveAbsR}`,
      partialRPopulation: correlations.partialRPopulation,
      partialRArea: correlations.partialRArea,
      partialRAging: correlations.partialRAging,
      partialRDensity: correlations.partialRDensity,
      titleX: ix.title,
      titleY: iy.title,
      normalizationBasisX: ix.normalizationBasis,
      normalizationBasisY: iy.normalizationBasis,
    })
    .from(correlations)
    .innerJoin(ix, and(eq(correlations.indicatorXId, ix.id), eq(ix.areaType, "prefecture")))
    .innerJoin(iy, and(eq(correlations.indicatorYId, iy.id), eq(iy.areaType, "prefecture")))
    .where(sql`ABS(${correlations.pearsonR}) < 0.99`)
    .orderBy(sql`${effectiveAbsR} DESC`)
    .limit(limit * 10);

  return rows
    .filter(
      (r) =>
        !isExcludedCorrelationKey(r.rankingKeyX) &&
        !isExcludedCorrelationKey(r.rankingKeyY) &&
        !isExcludedCorrelationPair(r.rankingKeyX, r.rankingKeyY),
    )
    .slice(0, limit);
}
