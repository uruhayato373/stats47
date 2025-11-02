"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";
import type { RankingItem } from "../types";

export async function getAllRankingItems(): Promise<RankingItem[]> {
  try {
    const repo = await RankingRepository.create();
    return await repo.getAllRankingItems();
  } catch (error) {
    console.error("getAllRankingItems error", error);
    return [];
  }
}

