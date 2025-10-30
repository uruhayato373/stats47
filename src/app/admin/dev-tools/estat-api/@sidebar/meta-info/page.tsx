import { EstatMetaInfoSidebar } from "@/features/estat-api/meta-info/components";

import type { EstatMetaInfo } from "@/features/estat-api/meta-info/types";

/**
 * MetaInfoSidebarSlot - e-Statメタ情報管理ページのサイドバー（サーバーコンポーネント）
 *
 * 責務:
 * - サーバーサイドで保存済みメタ情報を取得
 * - サイドバーを表示
 *
 * 注意: 現在、D1データベースからのメタ情報取得機能は未実装のため、
 * 空の配列を返します。将来的にEstatMetaInfoRepositoryが実装されたら、
 * ここでデータを取得するように更新してください。
 */
export default async function MetaInfoSidebarSlot() {
  let savedMetaInfoList: EstatMetaInfo[] = [];

  // TODO: EstatMetaInfoRepositoryが実装されたら、ここでD1データベースから取得
  // try {
  //   const repository = await EstatMetaInfoRepository.create();
  //   savedMetaInfoList = await repository.getStatsList({
  //     limit: 20,
  //   });
  // } catch (err) {
  //   console.error("保存済みデータ取得エラー:", err);
  // }

  return (
    <div className="h-full">
      <EstatMetaInfoSidebar initialData={savedMetaInfoList} />
    </div>
  );
}

