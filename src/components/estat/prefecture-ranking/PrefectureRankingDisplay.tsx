"use client";

import { useState, useMemo, useEffect } from "react";
import { AlertTriangle, Map, Database } from "lucide-react";
import { EstatStatsDataResponse, FormattedEstatData } from "@/lib/estat/types";
import { ChoroplethMap } from "@/components/estat/visualization";
import { TimeSelector } from "@/components/common/TimeSelector";
import EstatDataSummary from "@/components/estat/visualization/EstatDataSummary";
import { EstatStatsDataService } from "@/lib/estat/statsdata";
import ColorSchemeSelector, { MapVisualizationOptions } from "@/components/common/ColorSchemeSelector";

interface PrefectureRankingParams {
  statsDataId: string;
  categoryCode?: string;
  timeCode?: string;
}

interface PrefectureRankingDisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
  params: PrefectureRankingParams | null;
}

export default function PrefectureRankingDisplay({
  data,
  loading,
  error,
  params,
}: PrefectureRankingDisplayProps) {
  // EstatDataFormatterで変換
  const formattedData: FormattedEstatData | null = useMemo(() => {
    if (!data) return null;
    return EstatStatsDataService.formatStatsData(data);
  }, [data]);
  console.log("formattedData", formattedData);

  // 選択中の年次を管理
  const [selectedYear, setSelectedYear] = useState<string>("");

  // 地図可視化オプションを管理
  const [mapOptions, setMapOptions] = useState<MapVisualizationOptions>({
    colorScheme: 'interpolateBlues',
    divergingMidpoint: 'zero'
  });

  // formattedDataが変更されたときに最初の年度を選択
  useEffect(() => {
    if (formattedData && formattedData.years.length > 0) {
      const sortedYears = [...formattedData.years].sort(
        (a, b) => parseInt(b.timeCode) - parseInt(a.timeCode)
      );
      setSelectedYear(sortedYears[0].timeCode);
    } else {
      setSelectedYear("");
    }
  }, [formattedData]);

  console.log("selectedYear", selectedYear);

  // 選択された年次でデータをフィルタリング（全国データareaCode=00000を除外、カテゴリコードでもフィルタリング）
  const filteredData = useMemo(() => {
    if (!formattedData || !selectedYear) return formattedData?.values || [];

    return formattedData.values.filter((value) => {
      // 基本的なフィルタリング：年度と全国データの除外
      const basicFilter =
        value.timeCode === selectedYear && value.areaCode !== "00000";

      // カテゴリコードでのフィルタリング
      if (params?.categoryCode) {
        // カンマ区切りの場合は分割して処理
        const categoryCodes = params.categoryCode
          .split(",")
          .map((code) => code.trim());
        return basicFilter && categoryCodes.includes(value.categoryCode);
      }

      return basicFilter;
    });
  }, [formattedData, selectedYear, params]);
  console.log("filteredData", filteredData);
  console.log("params", params);

  // 統計情報を計算（EstatMapViewと同様の計算方法）
  const validDataPoints = filteredData.filter(
    (value) => value.numericValue !== null && value.numericValue !== 0
  );
  const values = validDataPoints.map((value) => value.numericValue!);

  const summary = {
    totalCount: filteredData.length,
    validCount: validDataPoints.length,
    min: values.length > 0 ? Math.min(...values) : null,
    max: values.length > 0 ? Math.max(...values) : null,
    average:
      values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null,
  };
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full"></div>
        <p className="mt-4 text-gray-600 dark:text-neutral-400">
          データを取得中...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-200">
              データ取得エラー
            </h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <Database className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
          データ取得前
        </h3>
        <p className="text-gray-600 dark:text-neutral-400">
          上のフォームから統計表IDを入力してデータを取得してください
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-500 mt-2">
          取得したデータの地図表示とランキングが表示されます
        </p>
      </div>
    );
  }

  if (!formattedData) return null;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
        <h2 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
          <Map className="w-5 h-5 text-indigo-600" />
          都道府県ランキング・地図表示
        </h2>
      </div>

      {/* 年次セレクターとデータサマリー */}
      <div className="p-4">
        <div className="mb-4">
          {/* 年次セレクター */}
          <TimeSelector
            years={formattedData?.years || []}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            className="mb-4"
          />

          {/* カラースキーマセレクター */}
          <ColorSchemeSelector
            options={mapOptions}
            onOptionsChange={setMapOptions}
            className="mb-4"
          />

          {/* データサマリー */}
          <EstatDataSummary
            totalCount={summary.totalCount}
            validCount={summary.validCount}
            min={summary.min}
            max={summary.max}
            average={summary.average}
          />
        </div>

        {/* コロプレス地図 */}

        <div className="w-full h-full overflow-x-auto">
          <ChoroplethMap
            data={filteredData}
            width={800}
            height={600}
            className="w-full max-w-full"
            options={mapOptions}
          />
        </div>
      </div>
    </div>
  );
}
