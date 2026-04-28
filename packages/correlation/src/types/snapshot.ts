import type { TopCorrelation } from "../repositories/list-top-correlations";

export const CORRELATION_SNAPSHOT_PREFIX = "snapshots/correlation";
export const CORRELATION_TOP_PAIRS_KEY = `${CORRELATION_SNAPSHOT_PREFIX}/top-pairs.json`;
export const CORRELATION_STATS_KEY = `${CORRELATION_SNAPSHOT_PREFIX}/stats.json`;

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
