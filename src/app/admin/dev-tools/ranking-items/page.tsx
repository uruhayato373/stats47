import { RankingRepository } from "@/features/ranking/repositories/ranking-repository";

import RankingItemsPageClient from "./RankingItemsPageClient";

/**
 * ランキング項目一覧画面（サーバーコンポーネント）
 */
export default async function RankingItemsPage() {
  const repository = await RankingRepository.create();
  const items = await repository.getAllRankingItems();

  return <RankingItemsPageClient initialItems={items} />;
}
