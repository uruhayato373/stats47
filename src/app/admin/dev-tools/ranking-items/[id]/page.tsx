import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/atoms/ui/button";

import { RankingItemForm } from "@/features/ranking/components/RankingItemForm";
import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

interface Props {
  params: { id: string };
}

/**
 * ランキング項目編集画面
 */
export default async function EditRankingItemPage({ params }: Props) {
  const repository = await RankingRepository.create();
  const item = await repository.getRankingItemById(Number(params.id));

  if (!item) {
    notFound();
  }

  // TODO: data_source_metadata取得
  // TODO: カテゴリ設定取得

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/dev-tools/ranking-items">
            <Button variant="ghost" size="sm">← 一覧に戻る</Button>
          </Link>
          <h1 className="text-2xl font-bold mt-4">ランキング項目編集</h1>
        </div>
      </div>
      <RankingItemForm item={item} mode="edit" />
    </div>
  );
}

