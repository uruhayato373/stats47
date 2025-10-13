import { EstatStatsDataResponse } from "@/lib/estat/types";
import { PrefectureRankingParams } from "@/types/models";

export interface DisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
  params: PrefectureRankingParams | null;
}
