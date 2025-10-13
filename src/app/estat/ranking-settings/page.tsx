import { fetchEstatMetainfoUnique } from "@/lib/d1-client";
import RankingSettingsPage from "@/components/estat/ranking-settings/RankingSettingsPage";
import { SavedMetadataItem } from "@/types/models";

export default async function Page() {
  const initialSavedMetadata = await fetchEstatMetainfoUnique({
    limit: 100,
    useRemote: true, // 開発環境でもリモートD1のデータを表示
  });

  return (
    <RankingSettingsPage
      initialSavedMetadata={initialSavedMetadata as SavedMetadataItem[]}
    />
  );
}
