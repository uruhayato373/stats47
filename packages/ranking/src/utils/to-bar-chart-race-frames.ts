import type { BarChartRaceFrame } from "@stats47/visualization/d3";
import type { StatsSchema } from "@stats47/types";

/**
 * StatsSchema[] → BarChartRaceFrame[] 変換
 *
 * yearCode でグループ化し、yearCode 昇順ソート。date は yearName を使用。
 */
export function toBarChartRaceFrames(stats: StatsSchema[]): BarChartRaceFrame[] {
  const grouped = new Map<string, { yearName: string; items: { name: string; value: number }[] }>();

  for (const s of stats) {
    let group = grouped.get(s.yearCode);
    if (!group) {
      group = { yearName: s.yearName, items: [] };
      grouped.set(s.yearCode, group);
    }
    group.items.push({ name: s.areaName, value: s.value });
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { yearName, items }]) => ({ date: yearName, items }));
}
