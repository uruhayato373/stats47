"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";

export async function updateGroupDisplayOrder(groupKey: string, newOrder: number): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    await repo.updateGroupDisplayOrder(groupKey, newOrder);
    return true;
  } catch (error) {
    console.error("updateGroupDisplayOrder error", error);
    return false;
  }
}

