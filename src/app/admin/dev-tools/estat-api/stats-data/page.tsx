import { getMockStatsData } from "@data/mock/estat-api/stats-data";

import { estatAPI } from "@/features/estat-api";
import {
  EstatDataDisplay,
  EstatDataFetcher,
} from "@/features/estat-api/stats-data/components";

import { buildEnvironmentConfig } from "@/infrastructure/config";

/**
 * StatsDataPage - e-Stat統計データページ（サーバーコンポーネント）
 *
 * 責務:
 * - サーバーサイドでデータ取得
 * - レイアウト構築
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
  const config = buildEnvironmentConfig();
  let statsData = null;
  let error = null;

  // サーバーサイドでデータ取得
  if (params.statsDataId && params.cdCat01) {
    try {
      if (config.isMock) {
        console.log(`[${config.environment}] Loading stats data from mock...`);
        statsData = getMockStatsData(params.statsDataId, params.cdCat01);

        if (!statsData) {
          error = `モックデータが見つかりません: ${params.statsDataId}_${params.cdCat01}`;
        }
      } else {
        console.log(`[${config.environment}] Fetching stats data from e-Stat API...`);
        statsData = await estatAPI.getStatsData({
          statsDataId: params.statsDataId,
          cdCat01: params.cdCat01,
          ...(params.cdArea && { cdArea: params.cdArea }),
          ...(params.cdTime && { cdTime: params.cdTime }),
          ...(params.cdCat02 && { cdCat02: params.cdCat02 }),
          ...(params.cdCat03 && { cdCat03: params.cdCat03 }),
          ...(params.cdCat04 && { cdCat04: params.cdCat04 }),
          ...(params.cdCat05 && { cdCat05: params.cdCat05 }),
          ...(params.cdCat06 && { cdCat06: params.cdCat06 }),
          ...(params.cdCat07 && { cdCat07: params.cdCat07 }),
          ...(params.cdCat08 && { cdCat08: params.cdCat08 }),
          ...(params.cdCat09 && { cdCat09: params.cdCat09 }),
          ...(params.cdCat10 && { cdCat10: params.cdCat10 }),
          ...(params.cdCat11 && { cdCat11: params.cdCat11 }),
          ...(params.cdCat12 && { cdCat12: params.cdCat12 }),
          ...(params.cdCat13 && { cdCat13: params.cdCat13 }),
          ...(params.cdCat14 && { cdCat14: params.cdCat14 }),
          ...(params.cdCat15 && { cdCat15: params.cdCat15 }),
          metaGetFlg: "Y",
          cntGetFlg: "N",
          explanationGetFlg: "N",
          annotationGetFlg: "N",
          replaceSpChars: "0",
        });
      }
    } catch (err) {
      console.error(`[${config.environment}] データ取得エラー:`, err);
      error = err instanceof Error ? err.message : "データの取得に失敗しました";
    }
  }

  return (
    <div className="space-y-6">
      <EstatDataFetcher />
      <EstatDataDisplay 
        data={statsData} 
        loading={false} 
        error={error} 
      />
    </div>
  );
}
