import { notFound } from "next/navigation";

import { Button } from "@/components/atoms/ui/button";

import { GroupItemsManager } from "@/features/ranking/components/admin/GroupItemsManager";
import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

/**
 * ランキンググループ項目管理画面
 */
export default async function GroupItemsPage({ params }: PageProps) {
  const { groupId } = await params;
  const repository = await RankingRepository.create();
  const group = await repository.getRankingGroupById(parseInt(groupId, 10));

  if (!group) {
    notFound();
  }

  const allItems = await repository.getAllRankingItems();
  const ungroupedItems = allItems.filter((item) => !item.groupId);

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{group.name} - 項目管理</h2>
        <a href="/admin/dev-tools/ranking-groups">
          <Button variant="outline">グループ一覧へ戻る</Button>
        </a>
      </div>
      <GroupItemsManager group={group} ungroupedItems={ungroupedItems} />
    </div>
  );
}
