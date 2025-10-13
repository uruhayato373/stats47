import { EstatStatsDataResponse } from "@/lib/estat/types";
import { PrefectureRankingParams } from "@/types/models";
import { RankingItemSettingsData } from "@/components/ranking-settings";

export interface DisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
  params: PrefectureRankingParams | null;
  settings?: RankingItemSettingsData;
  onSettingsChange?: (settings: RankingItemSettingsData) => Promise<void>;
}
