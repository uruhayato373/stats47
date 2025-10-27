import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/atoms/ui/resizable";

import { fetchFormattedStatsData } from "@/features/estat-api/stats-data";
import { EstatDataDisplay, EstatDataFetcher } from "@/features/estat-api/stats-data/components";

import { buildEnvironmentConfig } from "@/lib/environment";

import { getMockStatsData } from "@data/mock/estat-api/stats-data";

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

  // デフォルト値（mock環境用）
  const statsDataId = params.statsDataId || (config.isMock ? "0000010101" : undefined);
  const cdCat01 = params.cdCat01 || (config.isMock ? "A1101" : undefined);

  // サーバーサイドでデータ取得
  if (statsDataId && cdCat01) {
    try {
      if (config.isMock) {
        console.log(`[${config.environment}] Loading stats data from mock...`);
        statsData = getMockStatsData(statsDataId, cdCat01);

        if (!statsData) {
          error = `モックデータが見つかりません: ${statsDataId}_${cdCat01}`;
        }
      } else {
        console.log(`[${config.environment}] Fetching stats data from e-Stat API...`);
        statsData = await fetchFormattedStatsData(statsDataId, {
          categoryFilter: cdCat01,
          ...(params.cdArea && { areaFilter: params.cdArea }),
          ...(params.cdTime && { yearFilter: params.cdTime }),
        });
      }
    } catch (err) {
      console.error(`[${config.environment}] データ取得エラー:`, err);
      error = err instanceof Error ? err.message : "データの取得に失敗しました";
    }
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      {/* メインコンテンツエリア */}
      <ResizablePanel defaultSize={70} minSize={50}>
        <div className="h-full overflow-auto p-4">
          <EstatDataDisplay 
            data={statsData} 
            loading={false} 
            error={error} 
          />
        </div>
      </ResizablePanel>

      {/* リサイズハンドル */}
      <ResizableHandle />

      {/* サイドバー（右側） */}
      <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
        <div className="h-full overflow-auto p-4 bg-gray-50 dark:bg-neutral-900 border-l border-border">
          <EstatDataFetcher />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
