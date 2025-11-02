"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";

import type { RankingItem } from "../types";

export async function getRankingItem(
  rankingKey: string
): Promise<RankingItem | null> {
  try {
    const repo = await RankingRepository.create();
    return await repo.getRankingItemByKey(rankingKey);
  } catch (error) {
    // 本番などでログ送信やSentry等も可能
    console.error("getRankingItem error", error);
    return null;
  }
}
