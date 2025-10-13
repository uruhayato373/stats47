import { EstatMetainfoPageClient } from "@/components/estat/metainfo";
import { createD1Database } from "@/lib/d1-client";
import { SavedEstatMetainfoItem } from "@/types/models/estat";

export default async function EstatMetadataPage() {
  // サーバー側で保存済みメタデータを取得
  let initialSavedMetadata: SavedEstatMetainfoItem[] = [];

  try {
    const db = await createD1Database();
    const result = await db
      .prepare(
        "SELECT * FROM estat_metainfo_unique ORDER BY updated_at DESC LIMIT 50"
      )
      .all();
    initialSavedMetadata =
      result.results as unknown as SavedEstatMetainfoItem[];
  } catch (error) {
    console.error("Failed to fetch initial metadata:", error);
  }

  return (
    <EstatMetainfoPageClient initialSavedMetadata={initialSavedMetadata} />
  );
}
