/**
 * 都道府県関連の型定義
 */

export interface Prefecture {
  prefCode: string;
  prefName: string;
}

export interface PrefectureRankingParams {
  statsDataId: string;
  categoryCode?: string;
  timeCode?: string;
}
