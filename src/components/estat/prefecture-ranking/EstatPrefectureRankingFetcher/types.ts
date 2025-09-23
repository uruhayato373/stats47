export interface PrefectureRankingParams {
  statsDataId: string;
  categoryCode?: string;
  timeCode?: string;
}

export interface EstatPrefectureRankingFetcherProps {
  onSubmit: (params: PrefectureRankingParams) => void;
  loading: boolean;
}

export type FormData = {
  statsDataId: string;
  categoryCode: string;
  timeCode: string;
};
