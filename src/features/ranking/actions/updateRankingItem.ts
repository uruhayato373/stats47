"use server";
import { RankingRepository } from "../repositories/ranking-repository";

export interface UpdateRankingItemInput {
  rankingKey: string;
  updates: {
    label?: string;
    name?: string;
    description?: string;
    unit?: string;
    dataSourceId?: string;
    mapColorScheme?: string;
    mapDivergingMidpoint?: string;
    rankingDirection?: "asc" | "desc";
    conversionFactor?: number;
    decimalPlaces?: number;
  };
}

export async function updateRankingItem(input: UpdateRankingItemInput): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    return await repo.updateRankingItem(input.rankingKey, input.updates);
  } catch (error) {
    console.error("updateRankingItem error", error);
    return false;
  }
}
