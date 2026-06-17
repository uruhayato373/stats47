import type { StatsSchema } from "@stats47/types";

const DEFAULT_COLORS = [
  "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6",
  "#06b6d4", "#ec4899", "#6b7280", "#059669", "#d97706",
];

export interface CompositionSegment {
  key: string;
  label: string;
  color: string;
}

export interface CompositionChartData {
  /** 全年度データ（年ごとに各セグメントの値を持つ） */
  trendData: Array<Record<string, string | number>>;
  /** セグメント定義 */
  series: CompositionSegment[];
  /** 単位 */
  unit: string;
  /** 最新年のラベル */
  latestYearLabel: string;
}

/**
 * e-Stat 生データを構成比チャート用に変換
 *
 * @param rawDataList - 各セグメントの e-Stat 生データ配列
 * @param labels - セグメントラベル配列
 * @param colors - セグメントカラー配列
 * @param totalData - 合計の e-Stat 生データ（totalCode 指定時）
 */
export function toCompositionChartData(
  rawDataList: StatsSchema[][],
  labels: string[],
  colors: string[],
  totalData?: StatsSchema[],
): CompositionChartData {
  // 年度別にデータを集約
  const yearMap = new Map<string, Record<string, string | number>>();

  labels.forEach((label, idx) => {
    const rawData = rawDataList[idx] ?? [];
    for (const item of rawData) {
      const key = item.yearCode;
      if (!yearMap.has(key)) {
        yearMap.set(key, {
          category: item.yearCode,
          label: item.yearName || item.yearCode,
        });
      }
      const row = yearMap.get(key)!;
      row[label] = item.value ?? 0;
    }
  });

  // totalData がある場合、「その他」= total - sum(segments) を算出
  const othersLabel = "その他";
  const hasTotalData = totalData && totalData.length > 0;

  if (hasTotalData) {
    const totalByYear = new Map<string, number>();
    for (const item of totalData) {
      totalByYear.set(item.yearCode, item.value ?? 0);
    }

    for (const [yearCode, row] of yearMap) {
      const total = totalByYear.get(yearCode);
      if (total != null) {
        const segmentSum = labels.reduce(
          (sum, l) => sum + (typeof row[l] === "number" ? (row[l] as number) : 0),
          0,
        );
        const others = Math.max(0, total - segmentSum);
        row[othersLabel] = others;
      }
    }
  }

  const trendData = Array.from(yearMap.values()).sort((a, b) =>
    String(a.category).localeCompare(String(b.category)),
  );

  const series: CompositionSegment[] = labels.map((label, i) => ({
    key: label,
    label,
    color: colors[i] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  if (hasTotalData) {
    series.push({ key: othersLabel, label: othersLabel, color: "#9ca3af" });
  }

  const unit = rawDataList[0]?.[0]?.unit ?? "";
  const latestYearLabel =
    trendData.length > 0
      ? String(trendData[trendData.length - 1].label)
      : "";

  return { trendData, series, unit, latestYearLabel };
}
