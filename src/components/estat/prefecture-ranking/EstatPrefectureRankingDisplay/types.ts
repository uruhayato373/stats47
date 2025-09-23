import { EstatStatsDataResponse } from "@/lib/estat/types";

export interface PrefectureRankingParams {
  statsDataId: string;
  categoryCode?: string;
  timeCode?: string;
}

export interface EstatPrefectureRankingDisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
  params: PrefectureRankingParams | null;
}
