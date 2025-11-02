"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";
import type { CreateRankingGroupInput } from "../types";

export async function createRankingGroup(input: CreateRankingGroupInput): Promise<string | null> {
  try {
    const repo = await RankingRepository.create();
    return await repo.createRankingGroup(input);
  } catch (error) {
    console.error("createRankingGroup error", error);
    return null;
  }
}

