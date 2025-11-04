import Link from "next/link";

import { Button } from "@/components/atoms/ui/button";

import { RankingGroupsTable } from "@/features/ranking/groups/components/admin/RankingGroupsTable";
import { RankingRepository } from "@/features/ranking/shared/repositories/ranking-repository";

/**
 * ランキンググループ管理画面
 * 
 * 注意: このページは動的レンダリング（force-dynamic）のため、
 * ビルド時のプリレンダリングは行われず、ランタイム時にD1バインディングを使用します。
 */
export default async function RankingGroupsPage() {
  try {
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
  } catch (error) {
    console.error("Failed to fetch ranking groups:", error);
    // エラー時は空配列を返してページを表示
    return (
      <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">ランキンググループ管理</h2>
          <Link href="/admin/dev-tools/ranking-groups/new">
            <Button>新規グループ作成</Button>
          </Link>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>データの取得に失敗しました。ページを再読み込みしてください。</p>
        </div>
      </div>
    );
  }
}
