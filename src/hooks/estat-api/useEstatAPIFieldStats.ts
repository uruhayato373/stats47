/**
 * e-Stat API統計分野の統計数取得カスタムフック
 * 責務: 各分野の統計数の取得・管理のみ
 */

import { useState, useEffect } from "react";
import { STATS_FIELDS, StatsFieldCode } from "@/lib/estat-api/types/stats-list";
import {
  EstatStatsListFetcher,
  EstatStatsListError,
  EstatErrorType,
} from "@/lib/estat-api/stats-list";

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
  const [fieldStats, setFieldStats] = useState<FieldStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 各分野の統計数を取得
  useEffect(() => {
    if (!showStatsCount) return;

    const fetchFieldStats = async () => {
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
            // NO_DATA_FOUNDエラーの場合は正常なケースとして扱う
            if (
              error instanceof EstatStatsListError &&
              error.type === EstatErrorType.NO_DATA_FOUND
            ) {
              console.log(`分野 ${fieldCode}: データなし（正常）`);
              return {
                fieldCode: fieldCode as StatsFieldCode,
                count: 0,
                isLoading: false,
              };
            }

            console.error(`分野 ${fieldCode} の統計数取得エラー:`, error);
            return {
              fieldCode: fieldCode as StatsFieldCode,
              count: 0,
              isLoading: false,
            };
          }
        });

        const results = await Promise.all(promises);
        setFieldStats(results);
      } catch (error) {
        console.error("分野統計数取得エラー:", error);
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
