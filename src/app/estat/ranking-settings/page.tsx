import { createD1Database } from "@/lib/d1-client";
import RankingSettingsPage from "@/components/estat/ranking-settings/RankingSettingsPage";
import { SavedMetadataItem } from "@/types/models";

export default async function Page() {
  // サーバー側でメタデータを取得
  const db = await createD1Database();
  const result = await db
    .prepare(
      "SELECT * FROM estat_metainfo_unique ORDER BY updated_at DESC LIMIT 100"
    )
    .all();

  return (
    <RankingSettingsPage
      initialSavedMetadata={result.results as unknown as SavedMetadataItem[]}
    />
  );
}
