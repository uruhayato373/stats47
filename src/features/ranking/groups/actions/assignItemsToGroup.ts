"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";

export async function assignItemsToGroup(groupKey: string, itemKeys: string[], orders: number[]): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    await repo.assignItemsToGroup(groupKey, itemKeys, orders);
    return true;
  } catch (error) {
    console.error("assignItemsToGroup error", error);
    return false;
  }
}

