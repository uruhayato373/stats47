import { EstatMetainfoPage } from "@/components/estat/metainfo";
import { fetchEstatMetainfoUnique } from "@/lib/d1-client";
import { SavedEstatMetainfoItem } from "@/types/models/estat";

export default async function EstatMetadataPage() {
  const initialSavedMetadata = await fetchEstatMetainfoUnique({
    limit: 50,
    useRemote: true, // 開発環境でもリモートD1のデータを表示
  });

  return (
    <EstatMetainfoPage
      initialSavedMetadata={initialSavedMetadata as SavedEstatMetainfoItem[]}
    />
  );
}
