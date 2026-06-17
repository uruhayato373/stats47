import { extractYearsFromStats } from "@stats47/estat-api/server";

import type { KpiCardData } from "../types/visualization";
import type { StatsSchema } from "@stats47/types";

/**
 * e-Stat 生データから最新値 + 前年比を抽出（KPI カード用）
 */
export function toKpiCardData(rawData: StatsSchema[]): KpiCardData {
  if (rawData.length === 0) {
    return { value: null, unit: null, year: null, changeRate: null, changeDirection: null };
  }

  const years = extractYearsFromStats(rawData);
  if (years.length === 0) {
    return { value: null, unit: null, year: null, changeRate: null, changeDirection: null };
  }

  const latestYear = years[0];
  const target = rawData.find((d) => d.yearCode === latestYear.yearCode);

  if (!target) {
    return { value: null, unit: null, year: null, changeRate: null, changeDirection: null };
  }

  let changeRate: number | null = null;
  let changeDirection: KpiCardData["changeDirection"] = null;

  if (years.length >= 2) {
    const prevYear = years[1];
    const prevTarget = rawData.find((d) => d.yearCode === prevYear.yearCode);
    if (prevTarget && prevTarget.value !== null && prevTarget.value !== 0 && target.value !== null) {
      const rate = ((target.value - prevTarget.value) / Math.abs(prevTarget.value)) * 100;
      changeRate = Math.round(rate * 10) / 10;
      changeDirection = rate > 0 ? "increase" : rate < 0 ? "decrease" : "neutral";
    }
  }

  return {
    value: target.value,
    unit: target.unit ?? null,
    year: latestYear.yearName || latestYear.yearCode,
    changeRate,
    changeDirection,
  };
}
