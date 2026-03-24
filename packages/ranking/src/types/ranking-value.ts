import type { StatsSchema } from "@stats47/types";

/**
 * ランキング値（統計データ）のスキーマ
 * 統計データに順位情報を付加した形式
 */
export interface RankingValue extends StatsSchema {
  /** ランキング順位 */
  rank: number;
}
