"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";
import type { UpdateRankingGroupInput } from "../types";

export async function updateRankingGroup(groupKey: string, data: UpdateRankingGroupInput): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    await repo.updateRankingGroup(groupKey, data);
    return true;
  } catch (error) {
    console.error("updateRankingGroup error", error);
    return false;
  }
}

