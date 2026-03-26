import type { StatsSchema } from "@stats47/types";
import type { RankingValue } from "../types";

/**
 * 除算計算オプション
 */
export interface ComputeOptions {
  /** 計算タイプ */
  type: "ratio" | "per_capita" | "subtraction";
  /** 計算結果の項目名 */
  categoryName: string;
  /** 計算結果の項目コード */
  categoryCode: string;
  /** 計算結果の単位 */
  unit: string;
  /**
   * 分母マップのキー生成戦略
   * - "yearCode_areaCode": 年度+地域（デフォルト。複数年度データを扱う場合）
   * - "areaCode": 地域のみ（単一年度で取得済みのデータ同士を結合する場合）
   */
  keyBy?: "areaCode" | "yearCode_areaCode";
  /**
   * 計算結果に乗算するスケールファクター（デフォルト: 1）
   * 例: 1000 → 人口千人あたり, 100 → パーセント
   */
  scaleFactor?: number;
}

/**
 * 二つのランキングデータ（分子と分母）を元に計算値を導出する
 *
 * @param numeratorValues - 分子のデータ配列
 * @param denominatorValues - 分母のデータ配列
 * @param options - 計算設定
 * @returns 計算結果の統計データ配列（順位未計算）
 */
export function computeCalculatedValues(
  numeratorValues: RankingValue[],
  denominatorValues: RankingValue[],
  options: ComputeOptions
): StatsSchema[] {
  const result: StatsSchema[] = [];
  const keyBy = options.keyBy ?? "yearCode_areaCode";
  const scaleFactor = options.scaleFactor ?? 1;

  // 分母データをキーにしたMapに変換（高速検索用）
  const denominatorMap = new Map<string, RankingValue>();
  for (const v of denominatorValues) {
    const key = keyBy === "areaCode" ? (v.areaCode ?? "") : `${v.yearCode}_${v.areaCode}`;
    denominatorMap.set(key, v);
  }

  // 分子のデータをループして、対応する分母データがあれば計算
  for (const num of numeratorValues) {
    const key = keyBy === "areaCode" ? (num.areaCode ?? "") : `${num.yearCode}_${num.areaCode}`;
    const den = denominatorMap.get(key);

    if (!den) continue;

    let calculatedValue: number;
    if (options.type === "subtraction") {
      calculatedValue = (num.value - den.value) * scaleFactor;
    } else {
      // ratio / per_capita: 分母0はスキップ
      if (den.value === 0) continue;
      calculatedValue = (num.value / den.value) * scaleFactor;
    }

    // rankを除いたものをコピーし、新しい値を設定
    const { rank: _rank, ...baseData } = num;

    result.push({
      ...baseData,
      categoryCode: options.categoryCode,
      categoryName: options.categoryName,
      value: calculatedValue,
      unit: options.unit,
    });
  }

  return result;
}
