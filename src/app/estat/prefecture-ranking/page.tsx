import { createD1Database } from "@/lib/d1-client";
import PrefectureRankingPage from "@/components/estat/prefecture-ranking/PrefectureRankingPage";
import { SavedMetadataItem } from "@/types/models";

export default async function Page() {
  // サーバー側でメタデータを取得
  const db = await createD1Database();
  const result = await db
    .prepare(
      `
      SELECT stats_data_id, stat_name, title,
             MIN(created_at) as created_at,
             MAX(updated_at) as updated_at
      FROM estat_metainfo
      WHERE stats_data_id IS NOT NULL
      GROUP BY stats_data_id
      ORDER BY updated_at DESC
      LIMIT 100
    `
    )
    .all();

  return (
    <PrefectureRankingPage
      initialSavedMetadata={result.results as unknown as SavedMetadataItem[]}
    />
  );
}
