import { RankingRepository } from "@/features/ranking/shared/repositories/ranking-repository";

import RankingItemsPageClient from "./RankingItemsPageClient";

/**
 * ランキング項目一覧画面（サーバーコンポーネント）
 */
export default async function RankingItemsPage() {
  const repository = await RankingRepository.create();
  const items = await repository.getAllRankingItems();

  // データベースの値をそのまま使用（metadata.jsonの値は同期時にデータベースに保存済み）
  return <RankingItemsPageClient initialItems={items} />;
}
