"use server";
import { RankingRepository } from "../../shared/repositories/ranking-repository";
import type { RankingItem } from "../types";

export interface CreateRankingItemInput {
  rankingKey: string;
  areaType: "prefecture" | "city" | "national";
  label: string;
  ranking_name: string;
  annotation?: string;
  unit: string;
  mapColorScheme: string;
  mapDivergingMidpoint: string;
  rankingDirection: "asc" | "desc";
  conversionFactor: number;
  decimalPlaces: number;
}

export async function createRankingItem(input: CreateRankingItemInput): Promise<RankingItem | null> {
  try {
    const repo = await RankingRepository.create();
    return await repo.createRankingItem(input);
  } catch (error) {
    console.error("createRankingItem error", error);
    return null;
  }
}

