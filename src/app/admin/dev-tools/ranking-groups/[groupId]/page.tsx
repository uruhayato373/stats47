import { notFound } from "next/navigation";

import { getSubcategories } from "@/features/category";
import { RankingGroupForm } from "@/features/ranking/components/admin/forms/RankingGroupForm";
import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

/**
 * ランキンググループ編集画面
 */
export default async function EditRankingGroupPage({ params }: PageProps) {
  const { groupId } = await params;
  const repository = await RankingRepository.create();
  const group = await repository.getRankingGroupById(parseInt(groupId, 10));

  if (!group) {
    notFound();
  }

  const subcategories = await getSubcategories();

  return (
    <div className="max-w-2xl mx-auto px-2 py-4 space-y-4">
      <h2 className="text-xl font-semibold">グループ編集</h2>
      <RankingGroupForm group={group} subcategories={subcategories} />
    </div>
  );
}
