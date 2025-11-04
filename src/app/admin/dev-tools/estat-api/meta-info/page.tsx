import {
  fetchMetaInfoWithSource,
  type MetaInfoSource,
} from "@/features/estat-api/meta-info";
import { listSavedMetaInfo } from "@/features/estat-api/meta-info/repositories";
import type { SavedEstatMetaInfo } from "@/features/estat-api/meta-info/types";
import type { EstatMetaInfoResponse } from "@/features/estat-api/meta-info/types";

import MetaInfoPageClient from "./MetaInfoPageClient";

/**
 * MetaInfoPage - e-Statメタ情報管理ページ（サーバーコンポーネント）
 *
 * 責務:
 * - サーバーサイドでメタ情報を取得
 * - サーバーサイドで登録済みデータを取得
 * - クライアントコンポーネントにデータを渡す
 */
export default async function MetaInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ statsId?: string }>;
}) {
  const { statsId } = await searchParams;
  
  // メタ情報の取得
  let metaInfo: EstatMetaInfoResponse | null = null;
  let dataSource: MetaInfoSource | null = null;
  let error: string | null = null;

  if (statsId) {
    try {
      // fetchMetaInfoWithSource内部でR2 → e-Stat APIのフォールバックが行われる
      const result = await fetchMetaInfoWithSource(statsId);
      metaInfo = result.data;
      dataSource = result.source;
    } catch (err) {
      console.error("メタ情報取得エラー:", err);
      error = err instanceof Error ? err.message : "メタ情報の取得に失敗しました";
    }
  }

  // 登録済みデータの取得
  let savedMetaInfoList: SavedEstatMetaInfo[] = [];

  try {
    // リポジトリから保存済みメタ情報を取得（全件取得）
    savedMetaInfoList = await listSavedMetaInfo({
      limit: 1000, // 十分に大きな値を設定（実際のデータ量に応じて調整可能）
      orderBy: "updated_at",
      orderDirection: "DESC",
    });
  } catch (err) {
    console.error("保存済みデータ取得エラー:", err);
    // エラーが発生してもテーブルは表示する（空の配列で続行）
  }

  return (
    <MetaInfoPageClient
      metaInfo={metaInfo}
      statsId={statsId || null}
      dataSource={dataSource}
      error={error}
      savedMetaInfoList={savedMetaInfoList}
    />
  );
}

