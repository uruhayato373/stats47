import { EstatMetaInfoSidebar } from "@/features/estat-api/meta-info/components";
import { listSavedMetaInfo } from "@/features/estat-api/meta-info/repositories";
import type { EstatMetaInfo } from "@/features/estat-api/meta-info/types";

/**
 * MetaInfoSidebarSlot - e-Statメタ情報管理ページのサイドバー（サーバーコンポーネント）
 *
 * 責務:
 * - サーバーサイドで保存済みメタ情報を取得
 * - サイドバーを表示
 */
export default async function MetaInfoSidebarSlot() {
  let savedMetaInfoList: EstatMetaInfo[] = [];

  try {
    // リポジトリから保存済みメタ情報を取得
    savedMetaInfoList = await listSavedMetaInfo({
      limit: 20,
      orderBy: "updated_at",
      orderDirection: "DESC",
    });
  } catch (err) {
    console.error("保存済みデータ取得エラー:", err);
    // エラーが発生してもサイドバーは表示する（空の配列で続行）
  }

  return (
    <div className="h-full">
      <EstatMetaInfoSidebar initialData={savedMetaInfoList} />
    </div>
  );
}
