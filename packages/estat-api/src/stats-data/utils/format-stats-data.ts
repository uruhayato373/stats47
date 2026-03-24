import type {
    DataNote,
    EstatStatsDataResponse,
    FormattedEstatData,
} from "../types";

import { formatTableInfo } from "./format-table-info";
import { formatValues } from "./format-values";

/**
 * 統計データレスポンスを整形（最適化版）
 *
 * 責務: データ構造の変換のみを担当（純粋関数）
 *
 * 改善点:
 * - O(n×m) → O(n) のパフォーマンス最適化
 * - 全次元対応（area, time, tab, cat01-15）
 * - 特殊文字の適切な処理（null変換）
 * - 型安全性の向上
 *
 * @param response - e-Stat APIの統計データレスポンス
 * @returns 整形された統計データ
 * @throws {Error} 統計データが見つからない場合
 */
export function formatStatsData(
  response: EstatStatsDataResponse
): FormattedEstatData {
  const data = response.GET_STATS_DATA?.STATISTICAL_DATA;
  if (!data) {
    throw new Error("統計データが見つかりません");
  }

  const tableInf = data.TABLE_INF;
  if (!tableInf) {
    throw new Error("TABLE_INFが見つかりません");
  }

  // 1. テーブル情報を整形
  const tableInfo = formatTableInfo(tableInf);

  // 2. クラス情報
  const classInfo = data.CLASS_INF?.CLASS_OBJ || [];

  // 3. データ値を整形
  const rawValues = data.DATA_INF?.VALUE || [];
  const valuesArray = Array.isArray(rawValues) ? rawValues : [rawValues];
  const values = formatValues(valuesArray, classInfo);

  // 4. 注記情報
  const notes: DataNote[] = data.DATA_INF?.NOTE
    ? (Array.isArray(data.DATA_INF.NOTE)
        ? data.DATA_INF.NOTE
        : [data.DATA_INF.NOTE]
      ).map((note) => ({
        "@char": note["@char"] || "",
        "$": note.$ || "",
      }))
    : [];

  const result: FormattedEstatData = {
    tableInfo,
    values,
    notes,
  };

  return result;
}
