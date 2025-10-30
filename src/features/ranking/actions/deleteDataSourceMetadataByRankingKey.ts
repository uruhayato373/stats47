"use server";
import { RankingRepository } from "../repositories/ranking-repository";

export async function deleteDataSourceMetadataByRankingKey(rankingKey: string): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    await repo.deleteDataSourceMetadataByRankingKey(rankingKey);
    return true;
  } catch (error) {
    console.error("deleteDataSourceMetadataByRankingKey error", error);
    return false;
  }
}
