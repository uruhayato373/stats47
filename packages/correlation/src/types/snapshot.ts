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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, path: string): string {
  if (typeof value !== "string") throw new Error(`${path} must be a string`);
  return value;
}

function assertNullableString(value: unknown, path: string): string | null {
  if (value === null) return null;
  return assertString(value, path);
}

function assertNumber(value: unknown, path: string): number {
  if (!Number.isFinite(value)) throw new Error(`${path} must be finite`);
  return value as number;
}

function assertNullableNumber(value: unknown, path: string): number | null {
  if (value === null) return null;
  return assertNumber(value, path);
}

function parseTopCorrelation(value: unknown, index: number): TopCorrelation {
  if (!isRecord(value)) throw new Error(`pairs[${index}] must be an object`);
  return {
    rankingKeyX: assertString(value.rankingKeyX, `pairs[${index}].rankingKeyX`),
    rankingKeyY: assertString(value.rankingKeyY, `pairs[${index}].rankingKeyY`),
    titleX: assertNullableString(value.titleX, `pairs[${index}].titleX`),
    titleY: assertNullableString(value.titleY, `pairs[${index}].titleY`),
    normalizationBasisX: assertNullableString(value.normalizationBasisX, `pairs[${index}].normalizationBasisX`),
    normalizationBasisY: assertNullableString(value.normalizationBasisY, `pairs[${index}].normalizationBasisY`),
    pearsonR: assertNumber(value.pearsonR, `pairs[${index}].pearsonR`),
    effectiveR: assertNumber(value.effectiveR, `pairs[${index}].effectiveR`),
    partialRPopulation: assertNullableNumber(value.partialRPopulation, `pairs[${index}].partialRPopulation`),
    partialRArea: assertNullableNumber(value.partialRArea, `pairs[${index}].partialRArea`),
    partialRAging: assertNullableNumber(value.partialRAging, `pairs[${index}].partialRAging`),
    partialRDensity: assertNullableNumber(value.partialRDensity, `pairs[${index}].partialRDensity`),
  };
}

function assertGeneratedAt(value: unknown): string {
  const generatedAt = assertString(value, "generatedAt");
  if (!Number.isFinite(Date.parse(generatedAt))) throw new Error("generatedAt must be a valid date");
  return generatedAt;
}

export function parseCorrelationTopPairsSnapshot(value: unknown): CorrelationTopPairsSnapshot {
  if (!isRecord(value) || !Array.isArray(value.pairs)) {
    throw new Error("correlation top-pairs snapshot is schema-invalid");
  }
  return {
    generatedAt: assertGeneratedAt(value.generatedAt),
    pairs: value.pairs.map(parseTopCorrelation),
  };
}

export function parseCorrelationStatsSnapshot(value: unknown): CorrelationStatsSnapshot {
  if (!isRecord(value)) throw new Error("correlation stats snapshot must be an object");
  return {
    generatedAt: assertGeneratedAt(value.generatedAt),
    total: assertNumber(value.total, "total"),
    strong: assertNumber(value.strong, "strong"),
  };
}

function parseCorrelatedItem(value: unknown, index: number): CorrelatedItem {
  if (!isRecord(value) || !Array.isArray(value.scatterData)) {
    throw new Error(`pairs[${index}] is schema-invalid`);
  }
  return {
    rankingKey: assertString(value.rankingKey, `pairs[${index}].rankingKey`),
    title: assertString(value.title, `pairs[${index}].title`),
    subtitle: assertNullableString(value.subtitle, `pairs[${index}].subtitle`),
    unit: assertString(value.unit, `pairs[${index}].unit`),
    pearsonR: assertNumber(value.pearsonR, `pairs[${index}].pearsonR`),
    partialRPopulation: assertNullableNumber(value.partialRPopulation, `pairs[${index}].partialRPopulation`),
    partialRArea: assertNullableNumber(value.partialRArea, `pairs[${index}].partialRArea`),
    partialRAging: assertNullableNumber(value.partialRAging, `pairs[${index}].partialRAging`),
    partialRDensity: assertNullableNumber(value.partialRDensity, `pairs[${index}].partialRDensity`),
    scatterData: value.scatterData.map((point, pointIndex) => {
      if (!isRecord(point)) throw new Error(`pairs[${index}].scatterData[${pointIndex}] must be an object`);
      return {
        areaCode: assertString(point.areaCode, `pairs[${index}].scatterData[${pointIndex}].areaCode`),
        areaName: assertString(point.areaName, `pairs[${index}].scatterData[${pointIndex}].areaName`),
        x: assertNumber(point.x, `pairs[${index}].scatterData[${pointIndex}].x`),
        y: assertNumber(point.y, `pairs[${index}].scatterData[${pointIndex}].y`),
      };
    }),
  };
}

export function parseCorrelationByKeySnapshot(value: unknown): CorrelationByKeySnapshot {
  if (!isRecord(value) || !Array.isArray(value.pairs)) {
    throw new Error("correlation by-key snapshot is schema-invalid");
  }
  return {
    generatedAt: assertGeneratedAt(value.generatedAt),
    rankingKey: assertString(value.rankingKey, "rankingKey"),
    pairs: value.pairs.map(parseCorrelatedItem),
  };
}
