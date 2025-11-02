"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";

export async function removeItemsFromGroup(itemKeys: string[]): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    await repo.removeItemsFromGroup(itemKeys);
    return true;
  } catch (error) {
    console.error("removeItemsFromGroup error", error);
    return false;
  }
}

