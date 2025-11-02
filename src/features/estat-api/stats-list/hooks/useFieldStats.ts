import { useEffect, useState } from "react";

import {
  EstatErrorType,
  EstatStatsListError,
  EstatStatsListFetcher,
} from "@/features/estat-api/stats-list/services";
import {
  STATS_FIELDS,
  StatsFieldCode,
} from "@/features/estat-api/stats-list/types";

/**
 * 統計分野ごとの統計数情報
 */
export interface FieldStats {
  /** 統計分野コード */
  fieldCode: StatsFieldCode;
  /** 統計数 */
  count: number;
  /** 読み込み中かどうか */
  isLoading: boolean;
}

/**
 * useFieldStatsフックのオプション
 */
export interface UseFieldStatsOptions {
  /** 統計数を表示するかどうか（デフォルト: true） */
  showStatsCount?: boolean;
}

/**
 * useFieldStatsフックの戻り値
 */
export interface UseFieldStatsReturn {
  /** 各統計分野の統計数情報の配列 */
  fieldStats: FieldStats[];
  /** 読み込み中かどうか */
  isLoading: boolean;
  /** 指定された分野の統計数を取得する関数 */
  getFieldStats: (fieldCode: StatsFieldCode) => FieldStats | undefined;
  /** 数値をフォーマットする関数（1k, 10k+など） */
  formatCount: (count: number) => string;
}

/**
 * 統計分野ごとの統計数を取得するReact Hook
 *
 * @remarks
 * - 各統計分野の統計数を並列で取得
 * - NO_DATA_FOUNDエラーは正常なケースとして扱う（count: 0）
 * - 統計数の表示を制御可能（showStatsCountオプション）
 * - 取得した統計数を検索・フォーマットするヘルパー関数を提供
 *
 * @param options - フックのオプション
 * @param options.showStatsCount - 統計数を表示するかどうか（デフォルト: true）
 * @returns 統計数データとヘルパー関数
 *
 * @example
 * ```tsx
 * const { fieldStats, isLoading, getFieldStats, formatCount } = useFieldStats({
 *   showStatsCount: true
 * });
 *
 * const statsCount = getFieldStats("01");
 * const formatted = formatCount(1234); // "1.2k"
 * ```
 */
export function useFieldStats({
  showStatsCount = true,
}: UseFieldStatsOptions = {}): UseFieldStatsReturn {
  console.log("🔵 Hook: useFieldStats 初期化", { showStatsCount });
  const [fieldStats, setFieldStats] = useState<FieldStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!showStatsCount) return;

    console.log("🔵 Hook: useFieldStats 開始");

    const fetchFieldStats = async () => {
      console.log("🔵 Hook: fetchFieldStats 開始");
      setIsLoading(true);

      try {
        // 各分野の統計数を並列で取得
        const promises = Object.keys(STATS_FIELDS).map(async (fieldCode) => {
          try {
            const response = await EstatStatsListFetcher.searchByField(
              fieldCode,
              { limit: 1 }
            );
            return {
              fieldCode: fieldCode as StatsFieldCode,
              count: response.GET_STATS_LIST.DATALIST_INF.NUMBER || 0,
              isLoading: false,
            };
          } catch (error) {
            console.log(`🔵 Hook: 分野 ${fieldCode} のエラー詳細:`, error);

            // NO_DATA_FOUNDエラーの場合は正常なケースとして扱う
            if (
              error instanceof EstatStatsListError &&
              error.type === EstatErrorType.NO_DATA_FOUND
            ) {
              console.log(`✅ Hook: 分野 ${fieldCode} はデータなし（正常）`);
              return {
                fieldCode: fieldCode as StatsFieldCode,
                count: 0,
                isLoading: false,
              };
            }

            // エラーメッセージでNO_DATA_FOUNDを判定（フォールバック）
            if (error && typeof error === "object" && "message" in error) {
              const errorMessage = (error as { message: unknown }).message;
              console.log(`🔵 Hook: エラーメッセージ: ${errorMessage}`);
              if (
                errorMessage &&
                typeof errorMessage === "string" &&
                (errorMessage.includes("該当データはありませんでした") ||
                  errorMessage.includes(
                    "正常に終了しましたが、該当データはありませんでした"
                  ))
              ) {
                console.log(
                  `✅ Hook: 分野 ${fieldCode} はデータなし（メッセージ判定）`
                );
                return {
                  fieldCode: fieldCode as StatsFieldCode,
                  count: 0,
                  isLoading: false,
                };
              }
            }

            console.error(
              `❌ Hook: 分野 ${fieldCode} の統計数取得エラー:`,
              error
            );
            return {
              fieldCode: fieldCode as StatsFieldCode,
              count: 0,
              isLoading: false,
            };
          }
        });

        const results = await Promise.all(promises);
        console.log("✅ Hook: fetchFieldStats 完了", results);
        setFieldStats(results);
      } catch (error) {
        console.error("❌ Hook: 分野統計数取得エラー:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFieldStats();
  }, [showStatsCount]);

  const getFieldStats = (fieldCode: StatsFieldCode): FieldStats | undefined => {
    return fieldStats.find((stat) => stat.fieldCode === fieldCode);
  };

  const formatCount = (count: number): string => {
    if (count >= 10000) {
      return `${Math.floor(count / 1000)}k+`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return {
    fieldStats,
    isLoading,
    getFieldStats,
    formatCount,
  };
}
