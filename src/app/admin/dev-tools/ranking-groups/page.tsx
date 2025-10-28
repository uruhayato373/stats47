import Link from "next/link";

import { Button } from "@/components/atoms/ui/button";

import { RankingGroupsTable } from "@/features/ranking/components/admin/RankingGroupsTable";
import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

/**
 * ランキンググループ管理画面
 */
export default async function RankingGroupsPage() {
  const repository = await RankingRepository.create();
  const groups = await repository.getAllRankingGroups();

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">ランキンググループ管理</h2>
        <Link href="/admin/dev-tools/ranking-groups/new">
          <Button>新規グループ作成</Button>
        </Link>
      </div>
      <RankingGroupsTable groups={groups} />
    </div>
  );
}
