"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";

export interface DeleteRankingItemInput {
  rankingKey: string;
  areaType: "prefecture" | "city" | "national";
}

export async function deleteRankingItem(input: DeleteRankingItemInput): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    return await repo.deleteRankingItem(input.rankingKey, input.areaType);
  } catch (error) {
    console.error("deleteRankingItem error", error);
    return false;
  }
}

