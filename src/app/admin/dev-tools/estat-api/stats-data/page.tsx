import {
  fetchStatsDataWithSource,
  type StatsDataSource,
} from "@/features/estat-api/stats-data";
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

  // デバッグログ: パラメータの確認
  console.log("[StatsDataPage] URLパラメータ:", {
    statsDataId,
    cdCat01,
    cdArea: params.cdArea,
    cdTime: params.cdTime,
    allParams: params,
  });

  // 統計データの取得
  let statsData: EstatStatsDataResponse | null = null;
  let dataSource: StatsDataSource | null = null;
  let error: string | null = null;

  // データ取得条件の検証
  if (!statsDataId) {
    console.log("[StatsDataPage] statsDataIdが指定されていません");
    error = "統計表IDが必要です";
  } else if (!cdCat01) {
    console.log("[StatsDataPage] cdCat01が指定されていません");
    error = "分類01が必要です";
  } else {
    // サーバーサイドでデータ取得
    try {
      console.log("[StatsDataPage] データ取得開始:", {
        statsDataId,
        cdCat01,
        cdArea: params.cdArea,
        cdTime: params.cdTime,
      });
      const result = await fetchStatsDataWithSource(statsDataId, {
        categoryFilter: cdCat01,
        ...(params.cdArea && { areaFilter: params.cdArea }),
        ...(params.cdTime && { yearFilter: params.cdTime }),
      });
      statsData = result.data;
      dataSource = result.source;
      console.log("[StatsDataPage] データ取得成功:", {
        hasData: !!statsData,
        source: dataSource,
        status: statsData?.GET_STATS_DATA?.RESULT?.STATUS,
      });
    } catch (err) {
      console.error("[StatsDataPage] データ取得エラー:", err);
      console.error("[StatsDataPage] エラー詳細:", {
        statsDataId,
        cdCat01,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      error = err instanceof Error ? err.message : "データの取得に失敗しました";
    }
  }

  return (
    <div className="h-full p-4">
      <EstatDataDisplay
        data={statsData}
        loading={false}
        error={error}
        dataSource={dataSource}
      />
    </div>
  );
}
