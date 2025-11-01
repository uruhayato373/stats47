import "server-only";

/**
 * ランキング変換サービス
 *
 * e-Stat APIレスポンスをランキング形式（`RankingExportPayload`）に変換する機能を提供します。
 */

import { formatStatsData } from "../../stats-data/services/formatter";
import type { EstatStatsDataResponse, FormattedValue } from "../../stats-data/types";

import type {
  RankingDataPointValueOnly,
  RankingExportPayload,
} from "../types";

/**
 * FormattedValueからランキングデータポイントに変換
 *
 * @param formattedValue - 変換元のFormattedValue
 * @param timeCode - 時間コード（複数時間がある場合は指定）
 * @returns ランキングデータポイント、またはnull（値が無効な場合）
 */
function convertToRankingDataPoint(
  formattedValue: FormattedValue,
  timeCode?: string
): RankingDataPointValueOnly | null {
  // 値が無効な場合はスキップ
  if (formattedValue.value === null || formattedValue.value === undefined) {
    return null;
  }

  // areaが存在しない場合はスキップ
  if (
    !formattedValue.dimensions.area ||
    !formattedValue.dimensions.area.code
  ) {
    return null;
  }

  // 時間コードの決定（指定がない場合はdimensionsから取得）
  const targetTimeCode =
    timeCode || formattedValue.dimensions.time?.code || "";

  // 指定された時間コードと一致しない場合はスキップ
  if (timeCode && formattedValue.dimensions.time?.code !== timeCode) {
    return null;
  }

  return {
    areaCode: formattedValue.dimensions.area.code,
    areaName: formattedValue.dimensions.area.name,
    value: formattedValue.value,
  };
}

/**
 * 統計量を計算（min/max/mean/median）
 *
 * @param values - 数値の配列
 * @returns 統計量オブジェクト
 */
function calculateStatistics(values: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
} {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean =
    values.reduce((sum, val) => sum + val, 0) / values.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  return { min, max, mean, median };
}

/**
 * e-Stat APIレスポンスをランキング形式に変換
 *
 * @param response - e-Stat APIレスポンス
 * @param rankingKey - ランキングキー（item_code）
 * @param timeCode - 時間コード（オプション、指定がない場合は最初の時間コードを使用）
 * @param unit - 単位（オプション、responseから自動取得）
 * @returns ランキングエクスポートペイロード
 */
export function convertStatsDataToRankingFormat(
  response: EstatStatsDataResponse,
  rankingKey: string,
  timeCode?: string,
  unit?: string
): RankingExportPayload {
  console.log(
    `[convertStatsDataToRankingFormat] ランキング変換開始: rankingKey=${rankingKey}, timeCode=${timeCode || "auto"}`
  );

  // データ整形
  const formattedData = formatStatsData(response);

  // 単位の決定（引数で指定されていない場合）
  let targetUnit = unit;
  if (!targetUnit && formattedData.values.length > 0) {
    targetUnit = formattedData.values[0].unit || "";
  }

  // 時間コードの決定
  let targetTimeCode = timeCode;
  if (!targetTimeCode) {
    // 最初の値から時間コードを取得
    const firstValue = formattedData.values[0];
    if (firstValue && firstValue.dimensions.time) {
      targetTimeCode = firstValue.dimensions.time.code;
    }
  }

  if (!targetTimeCode) {
    throw new Error("時間コードが特定できません");
  }

  // FormattedValueからランキングデータポイントに変換
  const rankingPoints: RankingDataPointValueOnly[] = [];

  for (const value of formattedData.values) {
    const point = convertToRankingDataPoint(value, targetTimeCode);
    if (point) {
      rankingPoints.push(point);
    }
  }

  if (rankingPoints.length === 0) {
    throw new Error("ランキングデータポイントが生成できませんでした");
  }

  // 統計量を計算
  const values = rankingPoints.map((p) => p.value);
  const statistics = calculateStatistics(values);

  // メタデータ
  const metadata = {
    rankingKey,
    timeCode: targetTimeCode,
    unit: targetUnit || "",
    dataSourceId: "estat" as const,
  };

  const payload: RankingExportPayload = {
    values: rankingPoints,
    statistics,
    metadata,
  };

  console.log(
    `[convertStatsDataToRankingFormat] ランキング変換完了: ${rankingPoints.length}件`
  );

  return payload;
}

/**
 * 地域タイプを判定（prefecture/city/national）
 *
 * @param areaCodes - 地域コードの配列
 * @returns 地域タイプ
 */
export function determineAreaType(areaCodes: string[]): "prefecture" | "city" | "national" {
  if (areaCodes.length === 0) {
    return "prefecture";
  }

  // 全国コードが含まれているか
  if (areaCodes.includes("00000")) {
    return "national";
  }

  // 都道府県コード（2桁で始まる、または"13000"のような形式）
  const prefectureCodes = areaCodes.filter(
    (code) => code.length >= 5 && code.substring(0, 2) !== "00" && code.endsWith("000")
  );

  if (prefectureCodes.length > areaCodes.length * 0.8) {
    // 80%以上が都道府県コードの場合
    return "prefecture";
  }

  // 市区町村コード（5桁、最後が"000"でない）
  const cityCodes = areaCodes.filter(
    (code) => code.length >= 5 && !code.endsWith("000")
  );

  if (cityCodes.length > areaCodes.length * 0.8) {
    return "city";
  }

  // デフォルトは都道府県
  return "prefecture";
}

