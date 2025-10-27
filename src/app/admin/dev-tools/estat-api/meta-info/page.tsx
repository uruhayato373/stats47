import { estatAPI } from "@/features/estat-api";
import { buildEnvironmentConfig } from "@/infrastructure/config";
import type { EstatMetaInfo } from "@/infrastructure/database/estat/types";
import { mockDataProvider } from "@/infrastructure/database/mock";
import { getMockMetaInfo } from "@data/mock/estat-api/metainfo";

import {
  EstatMetaInfoDisplay,
  EstatMetaInfoFetcher,
  EstatMetaInfoSidebar,
} from "@/features/estat-api/meta-info/components";

/**
 * MetaInfoPage - e-Statメタ情報管理ページ（サーバーコンポーネント）
 *
 * 責務:
 * - サーバーサイドでデータ取得
 * - レイアウト構築
 */
export default async function MetaInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ statsId?: string }>;
}) {
  const { statsId } = await searchParams;
  const config = buildEnvironmentConfig();
  let metaInfo = null;
  let error = null;

  // サイドバー用データ取得
  let savedMetaInfoList: EstatMetaInfo[] = [];
  try {
    savedMetaInfoList = await mockDataProvider.fetchEstatMetainfoUnique({ limit: 20 });
  } catch (err) {
    console.error("保存済みデータ取得エラー:", err);
  }

  // サーバーサイドでデータ取得
  if (statsId) {
    try {
      if (config.isMock) {
        console.log(`[${config.environment}] Loading meta info from mock...`);
        metaInfo = getMockMetaInfo(statsId);

        if (!metaInfo) {
          error = `モックデータが見つかりません: ${statsId}`;
        }
      } else {
        console.log(`[${config.environment}] Fetching meta info from e-Stat API...`);
        metaInfo = await estatAPI.getMetaInfo({ statsDataId: statsId });
      }
    } catch (err) {
      console.error(`[${config.environment}] メタ情報取得エラー:`, err);
      error = err instanceof Error ? err.message : "メタ情報の取得に失敗しました";
    }
  }

  return (
    <div className="transition-all duration-300 min-h-screen bg-white dark:bg-neutral-900">
      <div className="flex flex-col lg:flex-row min-h-full">
        <div className="flex-1 bg-white dark:bg-neutral-800">
          <div className="p-4 md:p-6 space-y-6">
            <EstatMetaInfoFetcher />
            <EstatMetaInfoDisplay
              metaInfo={metaInfo}
              statsId={statsId || null}
              error={error}
            />
          </div>
        </div>
        <div className="hidden lg:block w-px border-s border-gray-200 dark:border-neutral-700"></div>
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          <EstatMetaInfoSidebar 
            initialData={savedMetaInfoList}
            className="h-full" 
          />
        </div>
      </div>
    </div>
  );
}
