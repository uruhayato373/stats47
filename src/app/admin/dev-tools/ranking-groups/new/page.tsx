import { RankingGroupForm } from "@/features/ranking/groups/components/admin/RankingGroupForm";

/**
 * ランキンググループ新規作成画面
 */
export default async function NewRankingGroupPage() {
  return (
    <div className="max-w-2xl mx-auto px-2 py-4 space-y-4">
      <h2 className="text-xl font-semibold">新規ランキンググループ作成</h2>
      <RankingGroupForm />
    </div>
  );
}
