import { EstatMetainfoPage } from "@/components/pages/EstatMetainfoPage";
import { EstatMetaInfoRepository } from "@/lib/database/estat/repositories";

/**
 * e-Statメタ情報ページ
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

  return <EstatMetainfoPage savedStatsList={savedStatsList} />;
}
