import { extractYearsFromStats } from "@stats47/estat-api/server";

import type { StatsTableData, StatsTableRowData } from "../types/visualization";
import type { StatsSchema } from "@stats47/types";

/**
 * 複数行の e-Stat 生データから全年度のテーブルデータを生成
 */
export function toStatsTableData(
  rawDataList: StatsSchema[][],
  rowDefs: Array<{ label: string; rankingLink?: string }>,
): StatsTableData {
  // 全行の全データから年度一覧を抽出（降順）
  const allData = rawDataList.flat();
  const years = extractYearsFromStats(allData);

  if (years.length === 0) {
    return { years: [], dataByYear: {} };
  }

  // 年度ごとに各行の値を抽出
  const dataByYear: Record<string, StatsTableRowData[]> = {};

  for (const year of years) {
    dataByYear[year.yearCode] = rowDefs.map((def, i) => {
      const rawData = rawDataList[i] ?? [];
      const target = rawData.find((d) => d.yearCode === year.yearCode);
      return {
        label: def.label,
        value: target?.value ?? null,
        unit: target?.unit ?? null,
        year: year.yearName || year.yearCode,
        rankingLink: def.rankingLink,
      };
    });
  }

  return { years, dataByYear };
}
