import { fetchMetaInfo } from "@/features/estat-api/meta-info";
import { EstatMetaInfoDisplay } from "@/features/estat-api/meta-info/components";

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
  let metaInfo = null;
  let error = null;

  if (statsId) {
    try {
      // fetchMetaInfo内部でR2 → e-Stat APIのフォールバックが行われる
      metaInfo = await fetchMetaInfo(statsId);
    } catch (err) {
      console.error("メタ情報取得エラー:", err);
      error =
        err instanceof Error ? err.message : "メタ情報の取得に失敗しました";
    }
  }

  return (
    <div className="p-4">
      <EstatMetaInfoDisplay
        metaInfo={metaInfo}
        statsId={statsId || null}
        error={error}
      />
    </div>
  );
}
