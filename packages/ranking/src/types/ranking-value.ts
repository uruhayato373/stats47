import type { StatsSchema } from "@stats47/types";

/**
 * ランキング値（統計データ）のスキーマ
 * 統計データに順位情報を付加した形式
 */
export interface RankingValue extends StatsSchema {
  /** ランキング順位 */
  rank: number;
  /** 標本から推計した人数 (指標の source.sampleCount を宣言したときだけ) */
  sampleCount?: number | null;
}

/**
 * 推計の人数が下限未満で順位から外した値 (参考値)。順位を持たないので RankingValue と分ける。
 * DATA-WAGE-TEACHER-COVERAGE-01 (2026-11-14 オーナー決定: 推計 10 人未満の県年は順位から外して参考値)。
 */
export interface RankingReferenceValue extends StatsSchema {
  sampleCount: number;
}
