"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";

export async function deleteRankingGroup(groupKey: string): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    await repo.deleteRankingGroup(groupKey);
    return true;
  } catch (error) {
    console.error("deleteRankingGroup error", error);
    return false;
  }
}

