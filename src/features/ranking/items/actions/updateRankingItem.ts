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
    const repo = await RankingRepository.create();
    return await repo.updateRankingItem(input.rankingKey, input.areaType, input.updates);
  } catch (error) {
    console.error("updateRankingItem error", error);
    return false;
  }
}

