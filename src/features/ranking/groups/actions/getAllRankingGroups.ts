"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";
import type { RankingGroup } from "../types";

export async function getAllRankingGroups(): Promise<RankingGroup[]> {
  try {
    const repo = await RankingRepository.create();
    return await repo.getAllRankingGroups();
  } catch (error) {
    console.error("getAllRankingGroups error", error);
    return [];
  }
}

