import Link from "next/link";

import { Button } from "@/components/atoms/ui/button";

import { RankingItemForm } from "@/features/ranking/components/admin/RankingItemForm";

/**
 * ランキング項目新規作成画面
 */
export default function NewRankingItemPage() {
  return (
    <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/dev-tools/ranking-items">
          <Button variant="ghost">← 一覧に戻る</Button>
        </Link>
        <h2 className="text-xl font-semibold">ランキング項目作成</h2>
      </div>

      <RankingItemForm mode="create" />
    </div>
  );
}

