import { RankingRepository } from "@/features/ranking/shared/repositories/ranking-repository";

import RankingItemsPageClient from "./RankingItemsPageClient";

/**
 * ランキング項目一覧画面（サーバーコンポーネント）
 * 
 * 注意: このページは動的レンダリング（force-dynamic）のため、
 * ビルド時のプリレンダリングは行われず、ランタイム時にD1バインディングを使用します。
 */
export default async function RankingItemsPage() {
  try {
    const repository = await RankingRepository.create();
    const items = await repository.getAllRankingItems();

    // データベースの値をそのまま使用（metadata.jsonの値は同期時にデータベースに保存済み）
    return <RankingItemsPageClient initialItems={items} />;
  } catch (error) {
    console.error("Failed to fetch ranking items:", error);
    // エラー時は空配列を返してページを表示（エラー状態はクライアント側で表示可能）
    return <RankingItemsPageClient initialItems={[]} />;
  }
}
