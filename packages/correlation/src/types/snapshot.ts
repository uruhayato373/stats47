export const CORRELATION_SNAPSHOT_PREFIX = "app/correlation";
export const CORRELATION_TOP_PAIRS_KEY = `${CORRELATION_SNAPSHOT_PREFIX}/top-pairs.json`;
export const CORRELATION_STATS_KEY = `${CORRELATION_SNAPSHOT_PREFIX}/stats.json`;
export const CORRELATION_BY_KEY_PREFIX = `${CORRELATION_SNAPSHOT_PREFIX}/by-ranking-key`;

export function correlationByKeyPath(rankingKey: string): string {
  return `${CORRELATION_BY_KEY_PREFIX}/${rankingKey}.json`;
}

// 上位 200 ペア snapshot 生成時の上限。Web 想定 limit (20) × 10 倍バッファ。
export const CORRELATION_TOP_PAIRS_SNAPSHOT_LIMIT = 200;

// per-ranking-key snapshot に保存するペア数。CorrelationSection が 10 件描画するため
// 余裕を持って 20 件保存し、Web 側で limit 切替を許容する。
export const CORRELATION_BY_KEY_LIMIT = 20;

/**
 * 旧 `find-highly-correlated.ts` の export 型。Phase 7 で同ファイルを削除したため
 * ここに inline 移動。R2 reader (`read-correlation-by-key.ts`) が import する。
 */
export interface CorrelatedItem {
  rankingKey: string;
  title: string;
  subtitle: string | null;
  unit: string;
  pearsonR: number;
  partialRPopulation: number | null;
  partialRArea: number | null;
  partialRAging: number | null;
  partialRDensity: number | null;
  scatterData: Array<{
    areaCode: string;
    areaName: string;
    x: number;
    y: number;
  }>;
}

/**
 * 旧 `list-top-correlations.ts` の export 型。Phase 7 で同ファイルを削除したため
 * ここに inline 移動。R2 reader (`read-correlation-snapshot.ts`) が import する。
 */
export interface TopCorrelation {
  rankingKeyX: string;
  rankingKeyY: string;
  titleX: string | null;
  titleY: string | null;
  normalizationBasisX: string | null;
  normalizationBasisY: string | null;
  pearsonR: number;
  effectiveR: number;
  partialRPopulation: number | null;
  partialRArea: number | null;
  partialRAging: number | null;
  partialRDensity: number | null;
}

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
