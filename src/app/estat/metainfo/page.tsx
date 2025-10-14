import { EstatMetainfoPage } from "@/components/estat-api/metainfo";
import { fetchEstatMetainfoUnique } from "@/lib/db";
import { SavedEstatMetainfoItem } from "@/lib/estat/types";

export default async function EstatMetadataPage() {
  const initialSavedMetadata = await fetchEstatMetainfoUnique({
    useRemote: true, // 開発環境でもリモートD1のデータを表示
  });

  return (
    <EstatMetainfoPage
      initialSavedMetadata={initialSavedMetadata as SavedEstatMetainfoItem[]}
    />
  );
}
