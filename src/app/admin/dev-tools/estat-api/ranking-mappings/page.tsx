import { listRankingMappingsAction } from "@/features/estat-api/ranking-mappings/actions";

import RankingMappingsPageClient from "./RankingMappingsPageClient";

/**
 * RankingMappingsPage - e-Statランキングマッピング管理ページ（サーバーコンポーネント）
 *
 * 責務:
 * - サーバーサイドでランキングマッピングデータを取得
 * - クライアントコンポーネントにデータを渡す
 */
export default async function RankingMappingsPage() {
  // ランキングマッピング一覧を取得
  let mappings = [];

  try {
    mappings = await listRankingMappingsAction({
      limit: 10000, // 十分に大きな値を設定
    });
  } catch (err) {
    console.error("ランキングマッピング取得エラー:", err);
    // エラーが発生してもテーブルは表示する（空の配列で続行）
  }

  return <RankingMappingsPageClient initialMappings={mappings} />;
}

