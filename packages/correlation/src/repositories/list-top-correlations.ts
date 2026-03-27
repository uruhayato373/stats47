import "server-only";

import {
  correlationAnalysis,
  getDrizzle,
  rankingItems,
} from "@stats47/database/server";
import { and, eq, notInArray, sql } from "drizzle-orm";
import {
  EXCLUDED_CORRELATION_KEYS,
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
 * 相関係数の絶対値が高い上位N件を取得する（ランキングタイトル付き）
 */
export async function listTopCorrelations(
  limit = 20,
  db?: ReturnType<typeof getDrizzle>
): Promise<TopCorrelation[]> {
  const d = db ?? getDrizzle();

  const riX = d
    .select({
      rankingKey: rankingItems.rankingKey,
      title: rankingItems.title,
      normalizationBasis: rankingItems.normalizationBasis,
    })
    .from(rankingItems)
    .where(
      and(
        eq(rankingItems.areaType, "prefecture"),
        eq(rankingItems.isActive, true)
      )
    )
    .as("ri_x");

  const riY = d
    .select({
      rankingKey: rankingItems.rankingKey,
      title: rankingItems.title,
      normalizationBasis: rankingItems.normalizationBasis,
    })
    .from(rankingItems)
    .where(
      and(
        eq(rankingItems.areaType, "prefecture"),
        eq(rankingItems.isActive, true)
      )
    )
    .as("ri_y");

  // 偏相関係数の最小絶対値（交絡変数を除外しても残る相関の強さ）
  // NULL の偏相関はピアソン r で補完し、全 NULL 時はピアソン r にフォールバック
  const effectiveAbsR = sql<number>`MIN(
    COALESCE(ABS(${correlationAnalysis.partialRPopulation}), ABS(${correlationAnalysis.pearsonR})),
    COALESCE(ABS(${correlationAnalysis.partialRArea}), ABS(${correlationAnalysis.pearsonR})),
    COALESCE(ABS(${correlationAnalysis.partialRAging}), ABS(${correlationAnalysis.pearsonR})),
    COALESCE(ABS(${correlationAnalysis.partialRDensity}), ABS(${correlationAnalysis.pearsonR}))
  )`;

  const rows = await d
    .select({
      rankingKeyX: correlationAnalysis.rankingKeyX,
      rankingKeyY: correlationAnalysis.rankingKeyY,
      pearsonR: correlationAnalysis.pearsonR,
      effectiveR: sql<number>`CASE WHEN ${correlationAnalysis.pearsonR} >= 0 THEN 1 ELSE -1 END * ${effectiveAbsR}`,
      partialRPopulation: correlationAnalysis.partialRPopulation,
      partialRArea: correlationAnalysis.partialRArea,
      partialRAging: correlationAnalysis.partialRAging,
      partialRDensity: correlationAnalysis.partialRDensity,
      titleX: sql<string | null>`${riX.title}`,
      titleY: sql<string | null>`${riY.title}`,
      normalizationBasisX: sql<string | null>`${riX.normalizationBasis}`,
      normalizationBasisY: sql<string | null>`${riY.normalizationBasis}`,
    })
    .from(correlationAnalysis)
    .innerJoin(riX, eq(correlationAnalysis.rankingKeyX, riX.rankingKey))
    .innerJoin(riY, eq(correlationAnalysis.rankingKeyY, riY.rankingKey))
    .where(
      and(
        sql`ABS(${correlationAnalysis.pearsonR}) < 0.99`,
        // 個別キー除外を SQL 側で実行（JS 側の overfetch を削減）
        notInArray(correlationAnalysis.rankingKeyX, EXCLUDED_CORRELATION_KEYS),
        notInArray(correlationAnalysis.rankingKeyY, EXCLUDED_CORRELATION_KEYS),
      ),
    )
    .orderBy(sql`${effectiveAbsR} DESC`)
    // ペア除外のみ JS 側で処理するため overfetch を 3x に縮小（10x → 3x）
    .limit(limit * 3);

  return rows
    .filter(
      (r) => !isExcludedCorrelationPair(r.rankingKeyX, r.rankingKeyY),
    )
    .slice(0, limit);
}
