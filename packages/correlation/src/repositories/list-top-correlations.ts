import "server-only";

import {
  correlations,
  getDrizzle,
  metrics,
} from "@stats47/database/server";
import { aliasedTable, eq, sql } from "drizzle-orm";
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

export async function listTopCorrelations(
  limit = 20,
  db?: ReturnType<typeof getDrizzle>
): Promise<TopCorrelation[]> {
  const d = db ?? getDrizzle();

  const ix = aliasedTable(metrics, "ix");
  const iy = aliasedTable(metrics, "iy");

  const effectiveAbsR = sql<number>`MIN(
    COALESCE(ABS(${correlations.partialRPopulation}), ABS(${correlations.pearsonR})),
    COALESCE(ABS(${correlations.partialRArea}), ABS(${correlations.pearsonR})),
    COALESCE(ABS(${correlations.partialRAging}), ABS(${correlations.pearsonR})),
    COALESCE(ABS(${correlations.partialRDensity}), ABS(${correlations.pearsonR}))
  )`;

  const rows = await d
    .select({
      rankingKeyX: correlations.metricKeyX,
      rankingKeyY: correlations.metricKeyY,
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
    .innerJoin(ix, eq(correlations.metricKeyX, ix.key))
    .innerJoin(iy, eq(correlations.metricKeyY, iy.key))
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
