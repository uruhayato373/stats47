import { fetchFormattedStatsData } from "@/features/estat-api/stats-data";
import { EstatDataDisplay } from "@/features/estat-api/stats-data/components";

/**
 * StatsDataMainSlot - e-Stat統計データページのメインコンテンツ（サーバーコンポーネント）
 *
 * 責務:
 * - サーバーサイドで統計データを取得
 * - メインコンテンツを表示
 */
export default async function StatsDataMainSlot({
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
  let statsData = null;
  let error = null;

  // パラメータの取得
  const statsDataId = params.statsDataId;
  const cdCat01 = params.cdCat01;

  // サーバーサイドでデータ取得
  if (statsDataId && cdCat01) {
    try {
      console.log(`Fetching stats data from e-Stat API...`);
      statsData = await fetchFormattedStatsData(statsDataId, {
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
    <div className="p-4">
      <EstatDataDisplay data={statsData} loading={false} error={error} />
    </div>
  );
}

