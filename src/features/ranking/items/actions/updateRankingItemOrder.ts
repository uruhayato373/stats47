"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";

export interface UpdateRankingItemOrderInput {
  rankingKey: string;
  areaType: "prefecture" | "city" | "national";
  displayOrderInGroup: number;
}

export async function updateRankingItemOrder(input: UpdateRankingItemOrderInput): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    return await repo.updateRankingItemOrder(input.rankingKey, input.areaType, input.displayOrderInGroup);
  } catch (error) {
    console.error("updateRankingItemOrder error", error);
    return false;
  }
}

