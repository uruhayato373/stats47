"use server";
import { RankingRepository } from "../repositories/ranking-repository";

export async function createDataSourceMetadata(input: {
  rankingKey: string;
  areaType: "prefecture" | "city" | "national";
  calculationType: "direct" | "ratio" | "aggregate";
  metadata: object;
}): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    await repo.createDataSourceMetadata(input);
    return true;
  } catch (error) {
    console.error("createDataSourceMetadata error", error);
    return false;
  }
}
