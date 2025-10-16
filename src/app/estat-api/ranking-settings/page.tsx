import { fetchEstatMetainfoUnique } from "@/lib/database";
import RankingSettingsPage from "@/components/ranking/settings/RankingSettingsPage";

export default async function Page() {
  const initialSavedMetadata = await fetchEstatMetainfoUnique({
    useRemote: true, // 開発環境でもリモートD1のデータを表示
  });

  return <RankingSettingsPage initialSavedMetadata={initialSavedMetadata} />;
}
