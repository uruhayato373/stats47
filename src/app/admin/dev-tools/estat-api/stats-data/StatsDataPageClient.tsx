"use client";

import { EstatDataDisplay } from "@/features/estat-api/stats-data/components";
import type { EstatStatsDataResponse } from "@/features/estat-api/stats-data/types";

/**
 * StatsDataPageClientProps - e-Stat統計データページのクライアントコンポーネントのプロパティ
 */
interface StatsDataPageClientProps {
  /** 統計データ */
  statsData: EstatStatsDataResponse | null;
  /** ローディング状態 */
  loading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * StatsDataPageClient - e-Stat統計データページのクライアントコンポーネント
 *
 * 責務:
 * - 統計データの表示
 */
export default function StatsDataPageClient({
  statsData,
  loading,
  error,
}: StatsDataPageClientProps) {
  return (
    <div className="h-full p-4">
      <EstatDataDisplay data={statsData} loading={loading} error={error} />
    </div>
  );
}
