/**
 * チャート用データ変換ユーティリティ
 *
 * StatsSchema[] をチャート用データ形式に変換する共通関数を提供。
 * プレゼンテーション層の責務として、データ取得層から取得した
 * StatsSchema をチャートコンポーネントで使用可能な形式に変換する。
 *
 * @module lib/chart-data-converter
 */

import type { StatsSchema } from "@/types/stats";

/**
 * StatsSchema[] を年度順にソート
 *
 * @param statsSchemas - ソートする StatsSchema 配列
 * @returns 年度順にソートされた StatsSchema 配列（新しい配列を返す）
 */
export function sortStatsSchemasByTimeCode(
  statsSchemas: StatsSchema[]
): StatsSchema[] {
  return [...statsSchemas].sort((a, b) => a.timeCode.localeCompare(b.timeCode));
}

/**
 * StatsSchema[] をチャート用データ形式に変換（単一データキー用）
 *
 * @param statsSchemas - 変換する StatsSchema 配列
 * @param options - 変換オプション
 * @returns チャート用データ配列
 *
 * @example
 * ```typescript
 * const chartData = convertStatsSchemasToTrendChartData(statsSchemas, {
 *   includeCategoryName: true,
 *   color: CHART_COLOR,
 * });
 * ```
 */
export function convertStatsSchemasToTrendChartData(
  statsSchemas: StatsSchema[],
  options?: {
    /** データキー名（デフォルト: "value"） */
    dataKey?: string;
    /** categoryName を含めるか（デフォルト: false） */
    includeCategoryName?: boolean;
    /** 色（オプション） */
    color?: string;
  }
): Array<Record<string, unknown>> {
  const sorted = sortStatsSchemasByTimeCode(statsSchemas);
  const dataKey = options?.dataKey || "value";
  const includeCategoryName = options?.includeCategoryName === true;

  return sorted.map((item) => ({
    year: item.timeCode,
    yearName: item.timeName,
    [dataKey]: typeof item.value === "number"
      ? item.value
      : Number(item.value) || 0,
    unit: item.unit,
    ...(includeCategoryName && { categoryName: item.categoryName }),
    ...(options?.color && { color: options.color }),
  }));
}

/**
 * 複数の StatsSchema[] をチャート用データ形式に変換（複数データキー用）
 *
 * @param config - データソースの設定配列
 * @param options - 変換オプション
 * @returns チャート用データ配列
 *
 * @example
 * ```typescript
 * const chartData = convertMultipleStatsSchemasToTrendChartData(
 *   [
 *     {
 *       statsSchemas: birthSchemas,
 *       dataKey: "birthValue",
 *       categoryName: "出生数",
 *       color: BIRTH_COLOR,
 *     },
 *     {
 *       statsSchemas: deathSchemas,
 *       dataKey: "deathValue",
 *       categoryName: "死亡数",
 *       color: DEATH_COLOR,
 *     },
 *   ],
 *   {
 *     includeCategoryName: true,
 *     includeColor: true,
 *   }
 * );
 * ```
 */
export function convertMultipleStatsSchemasToTrendChartData(
  config: Array<{
    /** StatsSchema 配列 */
    statsSchemas: StatsSchema[];
    /** データキー名 */
    dataKey: string;
    /** カテゴリ名（オプション） */
    categoryName?: string;
    /** 色（オプション） */
    color?: string;
  }>,
  options?: {
    /** 各データキーに対応する categoryName を含めるか（デフォルト: false） */
    includeCategoryName?: boolean;
    /** 各データキーに対応する color を含めるか（デフォルト: false） */
    includeColor?: boolean;
    /** 計算フィールド（例: netValue = inValue - outValue） */
    calculatedFields?: Array<{
      /** フィールドキー名 */
      fieldKey: string;
      /** 計算関数 */
      calculate: (data: Record<string, StatsSchema | undefined>) => number;
    }>;
  }
): Array<Record<string, unknown>> {
  // 各 StatsSchema[] を年度順にソート
  const sortedArrays = config.map((c) =>
    sortStatsSchemasByTimeCode(c.statsSchemas)
  );

  // 全年度コードを取得
  const timeCodes = new Set(
    sortedArrays.flatMap((arr) => arr.map((d) => d.timeCode))
  );

  // 年度ごとにマージ
  return Array.from(timeCodes)
    .sort()
    .map((timeCode) => {
      // 各データソースから該当年度のデータを取得
      const dataMap: Record<string, StatsSchema | undefined> = {};
      config.forEach((c, index) => {
        dataMap[c.dataKey] = sortedArrays[index].find(
          (d) => d.timeCode === timeCode
        );
      });

      // 最初のデータを取得（yearName, unit に使用）
      const firstData = Object.values(dataMap).find(Boolean);

      const result: Record<string, unknown> = {
        year: timeCode,
        yearName: firstData?.timeName || timeCode,
      };

      // 各データキーの値を設定
      config.forEach((c) => {
        const data = dataMap[c.dataKey];
        result[c.dataKey] =
          typeof data?.value === "number"
            ? data.value
            : Number(data?.value) || 0;

        // categoryName と color を含める（オプション）
        if (options?.includeCategoryName) {
          result[`${c.dataKey}CategoryName`] =
            c.categoryName || data?.categoryName || c.dataKey;
        }
        if (options?.includeColor && c.color) {
          result[`${c.dataKey}Color`] = c.color;
        }
      });

      // 計算フィールドを追加
      if (options?.calculatedFields) {
        options.calculatedFields.forEach((calc) => {
          result[calc.fieldKey] = calc.calculate(dataMap);
        });
      }

      // unit を設定（最初のデータの unit を使用）
      if (firstData) {
        result.unit = firstData.unit;
      }

      return result;
    });
}

