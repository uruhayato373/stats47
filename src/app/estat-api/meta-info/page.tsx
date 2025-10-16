import { EstatMetainfoPage } from "@/components/estat-api/meta-info";
import { fetchEstatMetainfoUnique } from "@/lib/database";
import { SavedEstatMetainfoItem } from "@/lib/estat-api/types/meta-info";

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
  // 環境判定は lib/database/index.ts で自動的に行われる
  const initialSavedMetadata = await fetchEstatMetainfoUnique({
    limit: 50,
    orderBy: "updated_at DESC",
  });

  return (
    <EstatMetainfoPage
      initialSavedMetadata={initialSavedMetadata as SavedEstatMetainfoItem[]}
    />
  );
}
