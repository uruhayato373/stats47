"use server";
import { revalidatePath } from "next/cache";

import { RankingRepository } from "../../shared/repositories/ranking-repository";
import type { CreateRankingGroupInput } from "../types";

export async function createRankingGroup(input: CreateRankingGroupInput): Promise<string | null> {
  try {
    // バリデーション: 少なくとも1つのサブカテゴリが必要
    if (!input.subcategoryIds || input.subcategoryIds.length === 0) {
      console.error("createRankingGroup error: At least one subcategory is required");
      return null;
    }

    const repo = await RankingRepository.create();
    const groupKey = await repo.createRankingGroup(input);
    
    // キャッシュを無効化してページを再検証
    revalidatePath("/admin/dev-tools/ranking-groups");
    revalidatePath(`/admin/dev-tools/ranking-groups/${groupKey}`);
    
    return groupKey;
  } catch (error) {
    console.error("createRankingGroup error", error);
    return null;
  }
}

