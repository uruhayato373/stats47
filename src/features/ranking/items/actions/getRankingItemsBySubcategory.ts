"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";
import type { RankingConfigResponse } from "../../shared/repositories/ranking-repository";

export async function getRankingItemsBySubcategory(subcategoryId: string): Promise<RankingConfigResponse | null> {
  try {
    const repo = await RankingRepository.create();
    return await repo.getRankingItemsBySubcategory(subcategoryId);
  } catch (error) {
    console.error("getRankingItemsBySubcategory error", error);
    return null;
  }
}

