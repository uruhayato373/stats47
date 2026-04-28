import type { CorrelatedItem } from "../repositories/find-highly-correlated";
import type { TopCorrelation } from "../repositories/list-top-correlations";

export const CORRELATION_SNAPSHOT_PREFIX = "snapshots/correlation";
export const CORRELATION_TOP_PAIRS_KEY = `${CORRELATION_SNAPSHOT_PREFIX}/top-pairs.json`;
export const CORRELATION_STATS_KEY = `${CORRELATION_SNAPSHOT_PREFIX}/stats.json`;
export const CORRELATION_BY_KEY_PREFIX = `${CORRELATION_SNAPSHOT_PREFIX}/by-ranking-key`;

export function correlationByKeyPath(rankingKey: string): string {
  return `${CORRELATION_BY_KEY_PREFIX}/${rankingKey}.json`;
}

// listTopCorrelations 内部で `.limit(N * 10)` してから除外フィルタを通すため、
// 200 件 snapshot を作るには内部 SQL 上限 2,000 件で十分（既存実装と同じ前提）。
// 200 = Web 想定 limit (20) × 10 倍バッファ。除外フィルタが想定外に厳しくても
// 上位 200 ペアまでなら十分埋まる経験則。
export const CORRELATION_TOP_PAIRS_SNAPSHOT_LIMIT = 200;

// per-ranking-key snapshot に保存するペア数。CorrelationSection が 10 件描画するため
// 余裕を持って 20 件保存し、Web 側で limit 切替を許容する。
export const CORRELATION_BY_KEY_LIMIT = 20;

export interface CorrelationTopPairsSnapshot {
  generatedAt: string;
  pairs: TopCorrelation[];
}

export interface CorrelationStatsSnapshot {
  generatedAt: string;
  total: number;
  strong: number;
}

export interface CorrelationByKeySnapshot {
  generatedAt: string;
  rankingKey: string;
  pairs: CorrelatedItem[];
}
