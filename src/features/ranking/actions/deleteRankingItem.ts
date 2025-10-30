"use server";
import { RankingRepository } from "../repositories/ranking-repository";

export async function deleteRankingItem(rankingKey: string): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    return await repo.deleteRankingItem(rankingKey);
  } catch (error) {
    console.error("deleteRankingItem error", error);
    return false;
  }
}
