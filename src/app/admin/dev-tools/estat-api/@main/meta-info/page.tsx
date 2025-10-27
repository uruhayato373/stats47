import { fetchMetaInfo } from "@/features/estat-api/meta-info";
import {
  EstatMetaInfoDisplay,
  EstatMetaInfoFetcher,
} from "@/features/estat-api/meta-info/components";

import { buildEnvironmentConfig } from "@/lib/environment";

import { getMockMetaInfo } from "@data/mock/estat-api/meta-info";

/**
 * MetaInfoMainSlot - e-Statメタ情報管理ページのメインコンテンツ（サーバーコンポーネント）
 *
 * 責務:
 * - サーバーサイドでメタ情報を取得
 * - メインコンテンツを表示
 */
export default async function MetaInfoMainSlot({
  searchParams,
}: {
  searchParams: Promise<{ statsId?: string }>;
}) {
  const { statsId } = await searchParams;
  const config = buildEnvironmentConfig();
  let metaInfo = null;
  let error = null;

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
        metaInfo = await fetchMetaInfo(statsId);
      }
    } catch (err) {
      console.error(`[${config.environment}] メタ情報取得エラー:`, err);
      error =
        err instanceof Error ? err.message : "メタ情報の取得に失敗しました";
    }
  }

  return (
    <div className="p-4 space-y-6">
      <EstatMetaInfoFetcher />
      <EstatMetaInfoDisplay
        metaInfo={metaInfo}
        statsId={statsId || null}
        error={error}
      />
    </div>
  );
}

