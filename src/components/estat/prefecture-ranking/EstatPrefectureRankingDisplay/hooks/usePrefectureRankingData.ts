"use client";

import { useMemo } from "react";
import { FormattedEstatData } from "@/lib/estat/types";
import { EstatStatsDataService } from "@/lib/estat/statsdata";
import { VisualizationSettings } from "@/lib/prefecture-ranking/visualization-settings";
import { PrefectureRankingSettingsService } from "@/lib/prefecture-ranking/settings-service";

interface UsePrefectureRankingDataOptions {
  data: any;
  selectedYear: string;
  categoryCode?: string;
  settings?: Partial<VisualizationSettings> | null;
}

export function usePrefectureRankingData({
  data,
  selectedYear,
  categoryCode,
  settings,
}: UsePrefectureRankingDataOptions) {
  // データの整形
  const formattedData = useMemo(() => {
    if (!data) return null;
    return EstatStatsDataService.formatStatsData(data);
  }, [data]);

  // データのフィルタリングと変換
  const filteredData = useMemo(() => {
    if (!formattedData || !selectedYear) return formattedData?.values || [];

    const filtered = formattedData.values.filter((value) => {
      const basicFilter =
        value.timeCode === selectedYear && value.areaCode !== "00000";

      if (categoryCode) {
        const categoryCodes = categoryCode
          .split(",")
          .map((code) => code.trim());
        return basicFilter && categoryCodes.includes(value.categoryCode);
      }

      return basicFilter;
    });

    // 単位変換を適用
    if (settings) {
      return filtered.map((value) => ({
        ...value,
        numericValue: value.numericValue
          ? PrefectureRankingSettingsService.applyConversion(
              value.numericValue,
              settings.conversion_factor || 1,
              settings.decimal_places || 0
            )
          : value.numericValue,
      }));
    }

    return filtered;
  }, [formattedData, selectedYear, categoryCode, settings]);

  // 統計情報の計算
  const summary = useMemo(() => {
    const validDataPoints = filteredData.filter(
      (value) => value.numericValue !== null && value.numericValue !== 0
    );
    const values = validDataPoints.map((value) => value.numericValue!);

    return {
      totalCount: filteredData.length,
      validCount: validDataPoints.length,
      min: values.length > 0 ? Math.min(...values) : null,
      max: values.length > 0 ? Math.max(...values) : null,
      average:
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null,
    };
  }, [filteredData]);

  return {
    formattedData,
    filteredData,
    summary,
  };
}
