"use server";
import { RankingRepository } from "../repositories/ranking-repository";
import type { RankingGroup } from "../types/group";

export async function getAllRankingGroups(): Promise<RankingGroup[]> {
  try {
    const repo = await RankingRepository.create();
    return await repo.getAllRankingGroups();
  } catch (error) {
    console.error("getAllRankingGroups error", error);
    return [];
  }
}
