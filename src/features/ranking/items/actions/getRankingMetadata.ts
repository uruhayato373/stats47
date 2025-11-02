"use server";

import { EstatRankingR2Repository } from "@/features/estat-api/ranking-mappings/repositories/rankingR2Repository";
import type { RankingMetadata } from "@/features/estat-api/ranking-mappings/types";

/**
 * ランキングメタデータをR2から取得するServer Action
 *
 * @param areaType - 地域タイプ（prefecture/city/national）
 * @param rankingKey - ランキングキー
 * @returns メタデータ、またはnull（見つからない場合）
 */
export async function getRankingMetadata(
  areaType: "prefecture" | "city" | "national",
  rankingKey: string
): Promise<RankingMetadata | null> {
  try {
    return await EstatRankingR2Repository.findRankingMetadata(
      areaType,
      rankingKey
    );
  } catch (error) {
    // 本番などでログ送信やSentry等も可能
    console.error("getRankingMetadata error", error);
    return null;
  }
}

