"use client";

import React, { useState, useMemo } from "react";
import { ChoroplethMap } from "@/components/estat/visualization";
import EstatDataSummary from "../EstatDataSummary";
import { TimeSelector } from "@/components/common/TimeSelector";
import { EstatStatsDataService } from "@/lib/estat/statsdata";
import { EstatStatsDataResponse, FormattedEstatData } from "@/lib/estat/types";

interface EstatMapViewProps {
  data: EstatStatsDataResponse;
}

export default function EstatMapView({ data }: EstatMapViewProps) {
  // EstatDataFormatterで変換
  const formattedData: FormattedEstatData | null = useMemo(() => {
    if (!data) return null;
    return EstatStatsDataService.formatStatsData(data);
  }, [data]);

  // 選択中の年次を管理
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    if (!formattedData || formattedData.years.length === 0) return "";
    const sortedYears = [...formattedData.years].sort(
      (a, b) => parseInt(b.timeCode) - parseInt(a.timeCode)
    );
    return sortedYears[0].timeCode;
  });

  // 選択された年次でデータをフィルタリング（全国データareaCode=00000を除外）
  const filteredData = useMemo(() => {
    if (!formattedData || !selectedYear) return formattedData?.values || [];

    return formattedData.values.filter(
      (value) => value.timeCode === selectedYear && value.areaCode !== "00000"
    );
  }, [formattedData, selectedYear]);

  // 統計情報を計算（ChoroplethMap用のデータは不要になったため、EstatDataSummary用のみ）
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

  if (!formattedData) return null;

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
          {formattedData.tableInfo.title || formattedData.tableInfo.statName}
        </h2>

        {/* 年次セレクター */}
        <TimeSelector
          years={formattedData?.years || []}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          className="mt-4"
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
      <div className="w-full overflow-x-auto">
        <ChoroplethMap
          data={filteredData}
          width={800}
          height={600}
          className="w-full max-w-full"
        />
      </div>
    </div>
  );
}
