import { EstatMetaInfoRepository } from "@/infrastructure/database/estat/repositories";
import { buildEnvironmentConfig } from "@/infrastructure/env";

import MetaInfoPageContent from "./MetaInfoPageContent";

/**
 * e-Statメタ情報ページ
 * Server Componentでデータ取得を行い、Client Componentに渡す
 *
 * 環境別の動作:
 * - mock: data/mock/database/estat_metainfo.json
 * - development: ローカルD1 (.wrangler/state/v3/d1)
 * - staging: リモートD1 (stats47_staging)
 * - production: リモートD1 (stats47)
 */
export default async function EstatMetadataPage() {
  // 環境判定は EstatMetaInfoRepository で自動的に行われる
  const repository = await EstatMetaInfoRepository.create();
  const savedStatsList = await repository.getStatsList({
    limit: 50,
    orderBy: "updated_at",
    orderDirection: "DESC",
  });

  // mock環境の場合は初期統計表IDを設定
  const config = buildEnvironmentConfig();
  console.log("[page.tsx] Environment config:", config);
  const initialStatsId = config.isMock ? "0000010101" : undefined;
  console.log("[page.tsx] initialStatsId:", initialStatsId);

  return (
    <MetaInfoPageContent
      savedStatsList={savedStatsList}
      initialStatsId={initialStatsId}
    />
  );
}
