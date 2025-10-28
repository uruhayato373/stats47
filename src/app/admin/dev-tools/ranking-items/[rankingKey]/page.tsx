import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/atoms/ui/button";

import { RankingItemForm } from "@/features/ranking/components/admin/RankingItemForm";
import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

interface PageProps {
  params: Promise<{ rankingKey: string }>;
}

export default async function RankingItemEditPage({ params }: PageProps) {
  const { rankingKey } = await params;
  const repository = await RankingRepository.create();
  const item = await repository.getRankingItemByKey(rankingKey);

  if (!item) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/dev-tools/ranking-items">
          <Button variant="ghost">← 一覧に戻る</Button>
        </Link>
        <h2 className="text-xl font-semibold">ランキング項目編集</h2>
      </div>

      <RankingItemForm item={item} mode="edit" rankingKey={rankingKey} />
    </div>
  );
}

