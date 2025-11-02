"use server";

import { EstatRankingR2Repository } from "@/features/estat-api/ranking-mappings/repositories/rankingR2Repository";
import type { StatsSchema } from "@/types/stats";

import type { RankingValue } from "../types";

/**
 * 4桁の年度コードを10桁のtimeCodeに変換
 *
 * @param yearCode - 年度コード（4桁、例: "2020"）
 * @returns 10桁のtimeCode（例: "2020000000"）
 */
function convertYearToTimeCode(yearCode: string): string {
  // 4桁の年度コードを10桁のtimeCodeに変換
  // 例: "2020" -> "2020000000"
  return `${yearCode}000000`;
}

/**
 * StatsSchema[]をRankingValue[]に変換
 *
 * @param statsSchemas - StatsSchema配列
 * @param rankingKey - ランキングキー
 * @returns RankingValue配列
 */
function convertStatsSchemaToRankingValues(
  statsSchemas: StatsSchema[],
  rankingKey: string
): RankingValue[] {
  // 値でソートして順位を付ける
  const sorted = [...statsSchemas].sort((a, b) => b.value - a.value);

  return sorted.map((schema, index) => ({
    rankingKey,
    areaCode: schema.areaCode,
    areaName: schema.areaName,
    timeCode: schema.timeCode,
    timeName: schema.timeName,
    value: schema.value,
    unit: schema.unit,
    rank: index + 1,
  }));
}

/**
 * ランキングデータをR2から取得するServer Action
 *
 * @param areaType - 地域タイプ（prefecture/city/national）
 * @param rankingKey - ランキングキー
 * @param yearCode - 年度コード（4桁、例: "2020"）
 * @returns RankingValue配列、またはnull（見つからない場合）
 */
export async function getRankingData(
  areaType: "prefecture" | "city" | "national",
  rankingKey: string,
  yearCode: string
): Promise<RankingValue[] | null> {
  try {
    // 4桁の年度コードを10桁のtimeCodeに変換（EstatRankingR2Repository.findRankingDataは10桁timeCodeを引数として受け取る）
    const timeCode = convertYearToTimeCode(yearCode);

    // R2からランキングデータを取得（findRankingData内で4桁年度コードに変換される）
    const statsSchemas = await EstatRankingR2Repository.findRankingData(
      areaType,
      rankingKey,
      timeCode
    );

    if (!statsSchemas || statsSchemas.length === 0) {
      return null;
    }

    // StatsSchema[]をRankingValue[]に変換
    const rankingValues = convertStatsSchemaToRankingValues(
      statsSchemas,
      rankingKey
    );

    return rankingValues;
  } catch (error) {
    // 本番などでログ送信やSentry等も可能
    console.error("getRankingData error", error);
    return null;
  }
}

