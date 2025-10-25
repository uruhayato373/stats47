/**
 * e-Stat API統計分野の統計数取得カスタムフック
 * 責務: 各分野の統計数の取得・管理のみ
 */

import { useState, useEffect } from "react";

import {
  EstatStatsListFetcher,
  EstatStatsListError,
  EstatErrorType,
} from "@/lib/estat-api/stats-list";
import { STATS_FIELDS, StatsFieldCode } from "@/lib/estat-api/types/stats-list";

export interface FieldStats {
  fieldCode: StatsFieldCode;
  count: number;
  isLoading: boolean;
}

export interface UseFieldStatsOptions {
  showStatsCount?: boolean;
}

export interface UseFieldStatsReturn {
  fieldStats: FieldStats[];
  isLoading: boolean;
  getFieldStats: (fieldCode: StatsFieldCode) => FieldStats | undefined;
  formatCount: (count: number) => string;
}

/**
 * e-Stat API統計分野の統計数取得フック
 * @param options - オプション
 * @returns 統計数データとヘルパー関数
 */
export function useEstatAPIFieldStats({
  showStatsCount = true,
}: UseFieldStatsOptions = {}): UseFieldStatsReturn {
  console.log("🔵 Hook: useEstatAPIFieldStats 初期化", { showStatsCount });
  const [fieldStats, setFieldStats] = useState<FieldStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 各分野の統計数を取得
  useEffect(() => {
    if (!showStatsCount) return;

    console.log("🔵 Hook: useEstatAPIFieldStats 開始");

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
              const errorMessage = (error as any).message;
              console.log(`🔵 Hook: エラーメッセージ: ${errorMessage}`);
              if (
                errorMessage &&
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

  /**
   * 指定された分野の統計数を取得
   */
  const getFieldStats = (fieldCode: StatsFieldCode): FieldStats | undefined => {
    return fieldStats.find((stat) => stat.fieldCode === fieldCode);
  };

  /**
   * 数値をフォーマット（1k, 10k+など）
   */
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
