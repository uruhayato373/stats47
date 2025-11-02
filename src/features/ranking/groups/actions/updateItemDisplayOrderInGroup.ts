"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";

export interface UpdateItemDisplayOrderInGroupInput {
  rankingKey: string;
  areaType: "prefecture" | "city" | "national";
  newOrder: number;
}

export async function updateItemDisplayOrderInGroup(input: UpdateItemDisplayOrderInGroupInput): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    await repo.updateItemDisplayOrderInGroup(input.rankingKey, input.areaType, input.newOrder);
    return true;
  } catch (error) {
    console.error("updateItemDisplayOrderInGroup error", error);
    return false;
  }
}

