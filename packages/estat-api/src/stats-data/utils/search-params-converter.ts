import type { GetStatsDataParams } from "../types";

/**
 * URLSearchParams型のパラメータ定義
 */
export interface StatsDataSearchParams {
  statsDataId?: string;
  cdTab?: string;
  cdTime?: string;
  cdArea?: string;
  cdCat01?: string;
  cdCat02?: string;
  cdCat03?: string;
  cdCat04?: string;
  cdCat05?: string;
  cdCat06?: string;
  cdCat07?: string;
  cdCat08?: string;
  cdCat09?: string;
  cdCat10?: string;
  cdCat11?: string;
  cdCat12?: string;
  cdCat13?: string;
  cdCat14?: string;
  cdCat15?: string;
}

/**
 * パラメータのバリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  params?: GetStatsDataParams;
}

/**
 * URLパラメータのバリデーションと変換
 */
export function validateAndConvertSearchParams(
  searchParams: StatsDataSearchParams
): ValidationResult {
  if (!searchParams.statsDataId) {
    return { isValid: false, error: "統計表IDが必要です" };
  }

  const params: GetStatsDataParams = {
    statsDataId: searchParams.statsDataId,
    ...(searchParams.cdTab && { cdTab: searchParams.cdTab }),
    ...(searchParams.cdTime && { cdTime: searchParams.cdTime }),
    ...(searchParams.cdArea && { cdArea: searchParams.cdArea }),
    ...(searchParams.cdCat01 && { cdCat01: searchParams.cdCat01 }),
    ...(searchParams.cdCat02 && { cdCat02: searchParams.cdCat02 }),
    ...(searchParams.cdCat03 && { cdCat03: searchParams.cdCat03 }),
    ...(searchParams.cdCat04 && { cdCat04: searchParams.cdCat04 }),
    ...(searchParams.cdCat05 && { cdCat05: searchParams.cdCat05 }),
    ...(searchParams.cdCat06 && { cdCat06: searchParams.cdCat06 }),
    ...(searchParams.cdCat07 && { cdCat07: searchParams.cdCat07 }),
    ...(searchParams.cdCat08 && { cdCat08: searchParams.cdCat08 }),
    ...(searchParams.cdCat09 && { cdCat09: searchParams.cdCat09 }),
    ...(searchParams.cdCat10 && { cdCat10: searchParams.cdCat10 }),
    ...(searchParams.cdCat11 && { cdCat11: searchParams.cdCat11 }),
    ...(searchParams.cdCat12 && { cdCat12: searchParams.cdCat12 }),
    ...(searchParams.cdCat13 && { cdCat13: searchParams.cdCat13 }),
    ...(searchParams.cdCat14 && { cdCat14: searchParams.cdCat14 }),
    ...(searchParams.cdCat15 && { cdCat15: searchParams.cdCat15 }),
  };

  return { isValid: true, params };
}
