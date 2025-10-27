import { EstatDataFetcher } from "@/features/estat-api/stats-data/components";

/**
 * StatsDataSidebarSlot - e-Stat統計データページのサイドバー（クライアントコンポーネント）
 *
 * 責務:
 * - 統計データ取得フォームを表示
 */
export default function StatsDataSidebarSlot() {
  return (
    <div className="h-full">
      <EstatDataFetcher />
    </div>
  );
}

