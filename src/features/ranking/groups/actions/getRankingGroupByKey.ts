"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";

import type { RankingGroup } from "../types";

export async function getRankingGroupByKey(
  groupKey: string
): Promise<RankingGroup | null> {
  try {
    const repo = await RankingRepository.create();
    return await repo.getRankingGroupByKey(groupKey);
  } catch (error) {
    console.error("getRankingGroupByKey error", error);
    return null;
  }
}
