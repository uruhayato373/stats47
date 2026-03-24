import { fetchFormattedStats } from "@stats47/estat-api/server";
import type { GetStatsDataParams } from "@stats47/estat-api/server";
import type { StatsSchema } from "@stats47/types";

import { getEstatCacheStorage } from "../services/get-estat-cache-storage";
import type { YAxisConfig } from "../types";

interface ComputeYAxisDomainOptions {
  yAxisConfig?: YAxisConfig;
  estatParams: GetStatsDataParams[];
  /**
   * ドメイン計算方式:
   * - "minMax": [min(0, min), max] — 折れ線グラフ向け
   * - "zeroMax": [0, max] — 棒グラフ・積み上げ面グラフ向け
   * - "symmetric": [-max, max] — 上下対称チャート向け
   * - "stackedMax": 各地域×年度で系列を合算した最大値 — 積み上げ面グラフ向け
   */
  domainType?: "minMax" | "zeroMax" | "symmetric" | "stackedMax";
}

/**
 * YAxisConfig に基づいて Y 軸ドメインを計算する。
 *
 * - mode "auto": undefined を返す（チャート側が表示データから算出）
 * - mode "fixed": config.domain をそのまま返す
 * - mode "sync": 全都道府県データを取得して算出
 */
export async function computeYAxisDomain({
  yAxisConfig,
  estatParams,
  domainType = "zeroMax",
}: ComputeYAxisDomainOptions): Promise<[number, number] | undefined> {
  if (!yAxisConfig) return undefined;

  switch (yAxisConfig.mode) {
    case "auto":
      return undefined;

    case "fixed":
      return yAxisConfig.domain;

    case "sync": {
      let allPrefData: StatsSchema[][];
      try {
        const storage = await getEstatCacheStorage();
        allPrefData = await Promise.all(
          estatParams.map((p) => fetchFormattedStats(p, storage)),
        );
      } catch {
        // sync ドメイン算出失敗時は auto にフォールバック
        return undefined;
      }

      if (domainType === "stackedMax") {
        const byAreaYear = new Map<string, number>();
        for (const d of allPrefData.flat() as StatsSchema[]) {
          if (d.value == null) continue;
          const key = `${d.areaCode}-${d.yearCode}`;
          byAreaYear.set(key, (byAreaYear.get(key) ?? 0) + d.value);
        }
        const totals = [...byAreaYear.values()];
        if (totals.length === 0) return undefined;
        return [0, Math.max(...totals)];
      }

      const allValues = allPrefData
        .flat()
        .map((d: StatsSchema) => d.value)
        .filter((v): v is number => v != null);

      if (allValues.length === 0) return undefined;

      const maxVal = Math.max(...allValues);

      switch (domainType) {
        case "minMax":
          return [Math.min(0, Math.min(...allValues)), maxVal];
        case "symmetric":
          return [-maxVal, maxVal];
        case "zeroMax":
        default:
          return [0, maxVal];
      }
    }
  }
}
