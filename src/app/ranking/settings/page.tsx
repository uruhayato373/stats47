import { EstatMetaInfoRepository } from "@/lib/database/estat/repositories";
import RankingSettingsPage from "@/components/organisms/ranking/settings/RankingSettingsPage";

export default async function Page() {
  const repository = await EstatMetaInfoRepository.create();
  const initialSavedMetadata = await repository.getStatsList();

  return <RankingSettingsPage initialSavedMetadata={initialSavedMetadata} />;
}
