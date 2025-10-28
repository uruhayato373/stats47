import Link from "next/link";

import { Button } from "@/components/atoms/ui/button";

import { RankingItemForm } from "@/features/ranking/components/RankingItemForm";

/**
 * ランキング項目新規作成画面
 */
export default function NewRankingItemPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link href="/admin/dev-tools/ranking-items">
          <Button variant="ghost" size="sm">← 一覧に戻る</Button>
        </Link>
        <h1 className="text-2xl font-bold mt-4">ランキング項目作成</h1>
      </div>
      <RankingItemForm mode="create" />
    </div>
  );
}

