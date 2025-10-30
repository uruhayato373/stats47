"use server";
import { RankingRepository } from "../repositories/ranking-repository";

export async function updateRankingItemOrder(rankingKey: string, displayOrderInGroup: number): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    return await repo.updateRankingItemOrder(rankingKey, displayOrderInGroup);
  } catch (error) {
    console.error("updateRankingItemOrder error", error);
    return false;
  }
}
