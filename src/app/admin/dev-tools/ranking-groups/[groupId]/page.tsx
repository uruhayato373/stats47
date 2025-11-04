import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import { GroupItemsManager } from "@/features/ranking/groups/components/admin/GroupItemsManager";
import { RankingGroupForm } from "@/features/ranking/groups/components/admin/RankingGroupForm";
import { RankingRepository } from "@/features/ranking/shared/repositories/ranking-repository";

export const runtime = "edge";

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

  const allItems = await repository.getAllRankingItems();
  const ungroupedItems = allItems.filter((item) => !item.groupKey);

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {group.label || group.name} - グループ管理
        </h2>
        <Link href="/admin/dev-tools/ranking-groups">
          <Button variant="outline">グループ一覧へ戻る</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* グループ情報フォーム */}
        <Card>
          <CardHeader>
            <CardTitle>グループ情報</CardTitle>
            <CardDescription>グループの基本設定を行います</CardDescription>
          </CardHeader>
          <CardContent>
            <RankingGroupForm group={group} />
          </CardContent>
        </Card>

        {/* 項目管理 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>項目管理</CardTitle>
            <CardDescription>グループに属する項目を管理します</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupItemsManager group={group} ungroupedItems={ungroupedItems} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
