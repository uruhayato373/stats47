"use server";
import { RankingRepository } from "../repositories/ranking-repository";

export async function updateItemDisplayOrderInGroup(rankingKey: string, newOrder: number): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    await repo.updateItemDisplayOrderInGroup(rankingKey, newOrder);
    return true;
  } catch (error) {
    console.error("updateItemDisplayOrderInGroup error", error);
    return false;
  }
}
