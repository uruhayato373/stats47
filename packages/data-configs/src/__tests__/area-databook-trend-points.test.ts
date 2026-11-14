import { describe, expect, it } from "vitest";

import { AREA_DATABOOK_TEMPLATE, listTemplateCharts } from "../area-databook";
import { buildRecipe } from "../recipe";
import { METRICS_REGISTRY } from "../registry";
import type { MetricConfig } from "../types";

/**
 * 県データブックの「推移」の図は 3 点以上 (AREA-DATABOOK-CHART-FIX-01)。
 *
 * 2026-09-25 の `/areas/13000` で、有効求人倍率は 1 点・1人当たり県民所得は 2 点だけだった。原因は
 * 図の側ではなく指標の定義の `years` (R2 へ入れる年の範囲) が 2022 年だけ・2020〜2021 年に絞られていたこと
 * (10-06・10-07 に 1975〜2022 年・2012〜2021 年へ広げて解消)。e-Stat に 3 年分がそろわない指標は
 * 推移の図にせず数値カードにする (2026-11-14 オーナー決定)。ここでは定義の年の数で止める。
 */
const MIN_TREND_POINTS = 3;
const TREND_TYPES = new Set(["line-chart", "stacked-area", "mixed-chart"]);

function yearCount(config: MetricConfig): number | null {
  const years = config.years;
  if (years === "all") return null;
  const listed = "years" in years ? years.years.length : years.to - years.from + 1;
  const excluded = (config.yearExclusions ?? []).reduce((sum, exclusion) => sum + exclusion.years.length, 0);
  return listed - excluded;
}

/**
 * 図の旧パラメータから、画面が読む指標の候補 (fetchEstatData と同じ逆引き: 統計表 ID と分類が一致し、
 * 年の補完以外の変換を持たない指標)
 */
function metricsFor(params: Record<string, unknown>): MetricConfig[] {
  return Object.values(METRICS_REGISTRY).filter((config) => {
    const recipe = buildRecipe(config);
    const transforms = Object.keys(recipe.ops ?? {}).filter((op) => op !== "supplements");
    if (!recipe.estatParams || (recipe.derived && transforms.length > 0)) return false;
    const estat = recipe.estatParams as unknown as Record<string, unknown>;
    return estat.statsDataId === params.statsDataId && estat.cdCat01 === params.cdCat01;
  });
}

describe("県データブックの推移の図", () => {
  const trends = listTemplateCharts(AREA_DATABOOK_TEMPLATE).filter(({ chart }) => TREND_TYPES.has(chart.componentType));

  it("推移の図がある", () => {
    expect(trends.length).toBeGreaterThan(0);
  });

  it.each(trends.map(({ chart }) => [chart.title, chart] as const))("%s は系列ごとに 3 年以上の値を持つ指標を読む", (_title, chart) => {
    const params = ((chart.componentProps ?? {}) as { estatParams?: Record<string, unknown>[] }).estatParams ?? [];
    for (const param of params) {
      const metrics = metricsFor(param);
      expect(metrics.length, `${param.statsDataId} ${param.cdCat01}`).toBeGreaterThan(0);
      const counts = metrics.map(yearCount).filter((count): count is number => count !== null);
      if (counts.length === 0) continue;
      expect(Math.max(...counts), `${metrics.map((m) => m.key).join(",")}`).toBeGreaterThanOrEqual(MIN_TREND_POINTS);
    }
  });
});
