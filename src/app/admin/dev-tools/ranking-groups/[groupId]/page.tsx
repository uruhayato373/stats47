import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/atoms/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/ui/tabs";

import { getSubcategories } from "@/features/category";
import { GroupItemsManager } from "@/features/ranking/groups/components/admin/GroupItemsManager";
import { RankingGroupForm } from "@/features/ranking/groups/components/admin/RankingGroupForm";
import { RankingRepository } from "@/features/ranking/shared/repositories/ranking-repository";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

/**
 * ランキンググループ編集・項目管理統合画面
 */
export default async function EditRankingGroupPage({ params }: PageProps) {
  const { groupId } = await params;
  const repository = await RankingRepository.create();
  // groupIdは実際にはgroupKeyです
  const group = await repository.getRankingGroupByKey(groupId);

  if (!group) {
    notFound();
  }

  const subcategories = await getSubcategories();
  const allItems = await repository.getAllRankingItems();
  const ungroupedItems = allItems.filter((item) => !item.groupKey);

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {group.label || group.name} - グループ管理
        </h2>
        <Link href="/admin/dev-tools/ranking-groups">
          <Button variant="outline">グループ一覧へ戻る</Button>
        </Link>
      </div>

      <Tabs defaultValue="group-info" className="w-full">
        <TabsList>
          <TabsTrigger value="group-info">グループ情報</TabsTrigger>
          <TabsTrigger value="items">項目管理</TabsTrigger>
        </TabsList>

        <TabsContent value="group-info" className="mt-4">
          <div className="max-w-2xl">
            <RankingGroupForm group={group} subcategories={subcategories} />
          </div>
        </TabsContent>

        <TabsContent value="items" className="mt-4">
          <GroupItemsManager group={group} ungroupedItems={ungroupedItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
