import { EstatRankingR2Repository } from "@/features/estat-api/ranking-mappings/repositories/rankingR2Repository";
import { RankingRepository } from "@/features/ranking/shared/repositories/ranking-repository";
import type { RankingItem } from "@/features/ranking/items/types";

import RankingItemsPageClient from "./RankingItemsPageClient";

/**
 * ランキング項目一覧画面（サーバーコンポーネント）
 */
export default async function RankingItemsPage() {
  const repository = await RankingRepository.create();
  const items = await repository.getAllRankingItems();

  // 各アイテムに対してmetadata.jsonからitemNameとunitを取得
  const itemsWithMetadata = await Promise.all(
    items.map(async (item): Promise<RankingItem> => {
      try {
        const metadata = await EstatRankingR2Repository.findRankingMetadata(
          item.areaType,
          item.rankingKey
        );

        if (metadata) {
          // metadata.jsonから取得したitemNameをlabelとnameに、unitをunitに設定
          return {
            ...item,
            label: metadata.itemName || item.label,
            name: metadata.itemName || item.name,
            unit: metadata.unit ?? item.unit,
          };
        }
      } catch (error) {
        console.warn(
          `[RankingItemsPage] metadata.json取得失敗: ${item.rankingKey}:${item.areaType}`,
          error
        );
      }

      // metadata.jsonが取得できない場合は元の値をそのまま使用
      return item;
    })
  );

  return <RankingItemsPageClient initialItems={itemsWithMetadata} />;
}
