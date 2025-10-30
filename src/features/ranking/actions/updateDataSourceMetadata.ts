"use server";
import { RankingRepository } from "../repositories/ranking-repository";

export async function updateDataSourceMetadata(input: {
  rankingKey: string;
  areaType: "prefecture" | "city" | "national";
  calculationType: "direct" | "ratio" | "aggregate";
  metadata: object;
}): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    await repo.updateDataSourceMetadata(input.rankingKey, input.areaType, {
      calculationType: input.calculationType,
      metadata: input.metadata,
    });
    return true;
  } catch (error) {
    console.error("updateDataSourceMetadata error", error);
    return false;
  }
}
