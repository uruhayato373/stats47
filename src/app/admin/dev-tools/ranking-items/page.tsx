import Link from "next/link";

import { Button } from "@/components/atoms/ui/button";

import { RankingItemsTable } from "@/features/ranking/components/RankingItemsTable";
import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

/**
 * ランキング項目一覧画面
 */
export default async function RankingItemsPage() {
  const repository = await RankingRepository.create();
  const items = await repository.getAllRankingItems();

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">ランキング項目一覧</h2>
        <Link href="/admin/dev-tools/ranking-items/new">
          <Button>新規作成</Button>
        </Link>
      </div>
      <RankingItemsTable items={items} />
    </div>
  );
}
