import type { RankingValue } from "./ranking-value";

/**
 * ランキングデータ取得/エクスポート結果の型定義
 */
export interface SyncRankingResult {
  success: boolean;
  message?: string;
  error?: string;
  exportedYears?: number;
  /** エクスポートされたデータの年度一覧 */
  years?: { yearCode: string; yearName: string }[];
  /** 最新年度のランキング値（ranking_data への格納用） */
  latestYearValues?: RankingValue[];
  /** 全年度のランキング値（DB保存・CSV生成用） */
  allYearsValues?: RankingValue[];
}
