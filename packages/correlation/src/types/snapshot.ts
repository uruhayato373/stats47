import type { TopCorrelation } from "../repositories/list-top-correlations";

export const CORRELATION_SNAPSHOT_PREFIX = "snapshots/correlation";
export const CORRELATION_TOP_PAIRS_KEY = `${CORRELATION_SNAPSHOT_PREFIX}/top-pairs.json`;
export const CORRELATION_STATS_KEY = `${CORRELATION_SNAPSHOT_PREFIX}/stats.json`;

// listTopCorrelations 内部で `.limit(N * 10)` してから除外フィルタを通すため、
// 200 件 snapshot を作るには内部 SQL 上限 2,000 件で十分（既存実装と同じ前提）。
// 200 = Web 想定 limit (20) × 10 倍バッファ。除外フィルタが想定外に厳しくても
// 上位 200 ペアまでなら十分埋まる経験則。
export const CORRELATION_TOP_PAIRS_SNAPSHOT_LIMIT = 200;

export interface CorrelationTopPairsSnapshot {
  generatedAt: string;
  pairs: TopCorrelation[];
}

export interface CorrelationStatsSnapshot {
  generatedAt: string;
  total: number;
  strong: number;
}
