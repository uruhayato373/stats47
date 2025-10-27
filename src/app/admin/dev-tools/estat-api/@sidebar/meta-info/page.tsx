import { EstatMetaInfoSidebar } from "@/features/estat-api/meta-info/components";

import { EstatMetaInfoRepository } from "@/infrastructure/database/estat/repositories";

import type { EstatMetaInfo } from "@/infrastructure/database/estat/types";

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
    const repository = await EstatMetaInfoRepository.create();
    savedMetaInfoList = await repository.getStatsList({
      limit: 20,
    });
  } catch (err) {
    console.error("保存済みデータ取得エラー:", err);
  }

  return (
    <div className="h-full">
      <EstatMetaInfoSidebar initialData={savedMetaInfoList} />
    </div>
  );
}

