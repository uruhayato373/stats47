import { fetchStatsData } from "@/features/estat-api/stats-data";
import { EstatDataDisplay } from "@/features/estat-api/stats-data/components";
import type { EstatStatsDataResponse } from "@/features/estat-api/stats-data/types";

/**
 * StatsDataPage - e-Stat統計データページ（サーバーコンポーネント）
 *
 * 責務:
 * - サーバーサイドで統計データを取得
 * - クライアントコンポーネントにデータを渡す
 */
export default async function StatsDataPage({
  searchParams,
}: {
  searchParams: Promise<{
    statsDataId?: string;
    cdCat01?: string;
    cdArea?: string;
    cdTime?: string;
    cdCat02?: string;
    cdCat03?: string;
    cdCat04?: string;
    cdCat05?: string;
    cdCat06?: string;
    cdCat07?: string;
    cdCat08?: string;
    cdCat09?: string;
    cdCat10?: string;
    cdCat11?: string;
    cdCat12?: string;
    cdCat13?: string;
    cdCat14?: string;
    cdCat15?: string;
  }>;
}) {
  const params = await searchParams;

  // パラメータの取得
  const statsDataId = params.statsDataId;
  const cdCat01 = params.cdCat01;

  // 統計データの取得
  let statsData: EstatStatsDataResponse | null = null;
  let error: string | null = null;

  // サーバーサイドでデータ取得
  if (statsDataId && cdCat01) {
    try {
      console.log(`Fetching stats data from e-Stat API...`);
      statsData = await fetchStatsData(statsDataId, {
        categoryFilter: cdCat01,
        ...(params.cdArea && { areaFilter: params.cdArea }),
        ...(params.cdTime && { yearFilter: params.cdTime }),
      });
    } catch (err) {
      console.error(`データ取得エラー:`, err);
      error = err instanceof Error ? err.message : "データの取得に失敗しました";
    }
  }

  return (
    <div className="h-full p-4">
      <EstatDataDisplay data={statsData} loading={false} error={error} />
    </div>
  );
}
