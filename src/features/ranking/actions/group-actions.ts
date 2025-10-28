"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RankingRepository } from "../repositories/ranking-repository";
import type {
  CreateRankingGroupInput,
  UpdateRankingGroupInput,
} from "../types/group";

/**
 * ランキンググループを作成
 */
export async function createGroupAction(formData: FormData) {
  const repository = await RankingRepository.create();

  const data: CreateRankingGroupInput = {
    groupKey: formData.get("groupKey") as string,
    subcategoryId: formData.get("subcategoryId") as string,
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    icon: (formData.get("icon") as string) || undefined,
    displayOrder: parseInt(formData.get("displayOrder") as string, 10) || 0,
    isCollapsed: formData.get("isCollapsed") === "true",
  };

  await repository.createRankingGroup(data);

  revalidatePath("/admin/dev-tools/ranking-groups");
  redirect("/admin/dev-tools/ranking-groups");
}

/**
 * ランキンググループを更新
 */
export async function updateGroupAction(groupId: number, formData: FormData) {
  const repository = await RankingRepository.create();

  const data: UpdateRankingGroupInput = {
    groupKey: formData.get("groupKey") as string,
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    icon: (formData.get("icon") as string) || undefined,
    displayOrder: formData.get("displayOrder")
      ? parseInt(formData.get("displayOrder") as string, 10)
      : undefined,
    isCollapsed:
      formData.get("isCollapsed") !== null
        ? formData.get("isCollapsed") === "true"
        : undefined,
  };

  await repository.updateRankingGroup(groupId, data);

  revalidatePath("/admin/dev-tools/ranking-groups");
  redirect("/admin/dev-tools/ranking-groups");
}

/**
 * ランキンググループを削除
 */
export async function deleteGroupAction(groupId: number) {
  const repository = await RankingRepository.create();

  await repository.deleteRankingGroup(groupId);

  revalidatePath("/admin/dev-tools/ranking-groups");
  redirect("/admin/dev-tools/ranking-groups");
}

/**
 * グループの表示順を更新
 */
export async function updateGroupOrderAction(
  updates: Array<{ id: number; order: number }>
) {
  const repository = await RankingRepository.create();

  await Promise.all(
    updates.map((update) =>
      repository.updateGroupDisplayOrder(update.id, update.order)
    )
  );

  revalidatePath("/admin/dev-tools/ranking-groups");
}

/**
 * 項目をグループに割り当て
 */
export async function assignItemsToGroupAction(
  groupId: number,
  itemIds: number[],
  orders: number[]
) {
  const repository = await RankingRepository.create();

  await repository.assignItemsToGroup(groupId, itemIds, orders);

  revalidatePath("/admin/dev-tools/ranking-groups");
}

/**
 * 項目をグループから削除
 */
export async function removeItemsFromGroupAction(itemIds: number[]) {
  const repository = await RankingRepository.create();

  await repository.removeItemsFromGroup(itemIds);

  revalidatePath("/admin/dev-tools/ranking-groups");
}

/**
 * グループ内の項目の表示順を更新
 */
export async function updateItemDisplayOrderInGroupAction(
  itemId: number,
  newOrder: number
) {
  const repository = await RankingRepository.create();

  await repository.updateItemDisplayOrderInGroup(itemId, newOrder);

  revalidatePath("/admin/dev-tools/ranking-groups");
}
