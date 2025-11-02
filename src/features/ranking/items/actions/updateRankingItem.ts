"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";

export interface UpdateRankingItemInput {
  rankingKey: string;
  areaType: "prefecture" | "city" | "national";
  updates: {
    label?: string;
    name?: string;
    annotation?: string;
    unit?: string;
    isActive?: boolean;
    mapColorScheme?: string;
    mapDivergingMidpoint?: string;
    rankingDirection?: "asc" | "desc";
    conversionFactor?: number;
    decimalPlaces?: number;
  };
}

export async function updateRankingItem(input: UpdateRankingItemInput): Promise<boolean> {
  try {
    console.log("updateRankingItem called with:", input);
    const repo = await RankingRepository.create();
    const result = await repo.updateRankingItem(input.rankingKey, input.areaType, input.updates);
    console.log("updateRankingItem result:", result);
    return result;
  } catch (error) {
    console.error("updateRankingItem error:", error);
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
      console.error("エラースタック:", error.stack);
      // エラーを再スローしてクライアント側でキャッチできるようにする
      throw new Error(`データベース更新エラー: ${error.message}`);
    }
    throw new Error("データベース更新中に予期しないエラーが発生しました");
  }
}

