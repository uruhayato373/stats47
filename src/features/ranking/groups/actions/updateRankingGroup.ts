"use server";
import { revalidatePath } from "next/cache";

import { RankingRepository } from "../../shared/repositories/ranking-repository";
import type { UpdateRankingGroupInput } from "../types";

export async function updateRankingGroup(groupKey: string, data: UpdateRankingGroupInput): Promise<boolean> {
  try {
    const repo = await RankingRepository.create();
    await repo.updateRankingGroup(groupKey, data);
    
    // キャッシュを無効化してページを再検証
    revalidatePath("/admin/dev-tools/ranking-groups");
    revalidatePath(`/admin/dev-tools/ranking-groups/${groupKey}`);
    
    return true;
  } catch (error) {
    console.error("updateRankingGroup error", error);
    return false;
  }
}

