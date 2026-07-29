import "server-only";

import { fetchPrefectureTopology, fetchAllCitiesTopology } from "@stats47/gis/geoshape";
import {
  readAllYearsRankingValuesFromR2,
  readRankingItemFromR2,
  readRankingValuesFromR2,
} from "@stats47/ranking/server";
import { isOk, type AreaType, type TopoJSONTopology } from "@stats47/types";

import { logger } from "@/lib/logger";

import type { ThemeConfig, ThemeIndicatorData } from "../types";
import type { RankingItem, RankingValue } from "@stats47/ranking";

export interface ThemePageData {
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  topology: TopoJSONTopology | null;
}

/**
 * 都道府県指標の全年 R2 values から「全国」トレンド (年次の県平均) を構築する。
 *
 * R2 ranking values (app/ranking/<key>/values.json) には全国行 (00000) が無いため、
 * 各年の都道府県平均を「全国」系列 (MiniLineChart 用) として用いる。
 * ThemeMetricsDashboard も都道府県未選択時は県平均を KPI 値に使うため整合する。
 */
function buildNationalSeries(
  allYears: RankingValue[],
): { year: number; value: number }[] {
  const byYear = new Map<number, number[]>();
  for (const v of allYears) {
    if (typeof v.value !== "number" || !Number.isFinite(v.value)) continue;
    const y = Number(String(v.yearCode).slice(0, 4));
    if (!Number.isFinite(y)) continue;
    const arr = byYear.get(y);
    if (arr) arr.push(v.value);
    else byYear.set(y, [v.value]);
  }
  return [...byYear.entries()]
    .map(([year, vals]) => ({
      year,
      value: vals.reduce((a, b) => a + b, 0) / vals.length,
    }))
    .sort((a, b) => a.year - b.year);
}

/**
 * テーマダッシュボード用のデータを一括取得
 *
 * 全指標の RankingItem 定義 + R2 ranking values + TopoJSON を並列取得し、
 * indicatorDataMap として返す。tabIndicators がある場合はそのキーもマージして取得する。
 *
 * ★データ source は R2 の `app/ranking/<key>/values.json` のみ (e-Stat ライブ取得はしない)。
 *   e-Stat ライブ取得は Cloudflare Workers ランタイムで失敗し本番で error fallback を招いたため、
 *   /ranking/* と同一の R2 source に統一した (完全DBレス: docs/01_技術設計/02_データアーキテクチャ.md)。
 *   build 時は readRankingValuesFromR2 が ok([]) を返すため、ページは force-dynamic で runtime 描画する。
 *
 * - prefecture: readAllYearsRankingValuesFromR2 で全年を 1 read → current 年 values + 全国(県平均)トレンド
 * - city: readRankingValuesFromR2 で current 年のみ (全市区町村×全年は巨大なため)
 */
export async function loadThemeData(
  theme: ThemeConfig,
  options?: { areaType?: AreaType },
): Promise<ThemePageData | null> {
  const areaType: AreaType = options?.areaType ?? "prefecture";

  // tabIndicators のキーと rankingKeys をマージ（重複排除）
  const tabKeys = theme.tabIndicators?.map((t) => t.rankingKey) ?? [];
  const allKeys = [...new Set([...theme.rankingKeys, ...tabKeys])];

  // 1. 全指標の RankingItem 定義を並列取得
  const rankingItemResults = await Promise.all(
    allKeys.map((key) =>
      readRankingItemFromR2(key, areaType).catch((error) => {
        logger.error({ error, key, areaType }, "テーマダッシュボード: RankingItem取得失敗");
        return null;
      })
    )
  );

  const validItems: { key: string; item: RankingItem }[] = [];
  for (let i = 0; i < allKeys.length; i++) {
    const result = rankingItemResults[i];
    if (result && isOk(result) && result.data) {
      validItems.push({ key: allKeys[i], item: result.data });
    }
  }

  if (validItems.length === 0) return null;

  // 2. 全指標のデータ + TopoJSON を並列取得。
  //    hideMap テーマは地図を描画しないため、巨大な GIS topology を fetch しない
  //    (無駄なメモリ消費で dev/本番ともに負荷増・OOM の原因になる。2026-06-20)。
  const topologyPromise = theme.hideMap
    ? Promise.resolve(null)
    : areaType === "city"
      ? fetchAllCitiesTopology().catch((error) => {
          logger.error({ error }, "テーマダッシュボード: city topology取得失敗");
          return null;
        })
      : fetchPrefectureTopology().catch((error) => {
          logger.error({ error }, "テーマダッシュボード: topology取得失敗");
          return null;
        });

  const valuesPromises = validItems.map(({ key, item }) => {
    const yearCode = item.latestYear?.yearCode;
    if (!yearCode)
      return Promise.resolve({
        key,
        values: [] as RankingValue[],
        nationalValue: undefined as number | undefined,
        nationalSeries: undefined as { year: number; value: number }[] | undefined,
      });

    // city: R2 から直接読む (e-Stat 経由しない。全国行は無いため平均にフォールバック)
    if (areaType === "city") {
      return readRankingValuesFromR2(key, "city", yearCode)
        .then((result) => {
          const values = isOk(result) ? result.data : [];
          return { key, values, nationalValue: undefined as number | undefined, nationalSeries: undefined as { year: number; value: number }[] | undefined };
        })
        .catch((error) => {
          logger.error({ error, key, yearCode }, "テーマダッシュボード: city values 取得失敗");
          return { key, values: [] as RankingValue[], nationalValue: undefined as number | undefined, nationalSeries: undefined as { year: number; value: number }[] | undefined };
        });
    }

    // prefecture: R2 から全年度を 1 read (e-Stat ライブ取得しない。/ranking/* と同一 source)。
    // current 年の values + 全国(県平均)トレンドを構築。全国行は無いため nationalValue は undefined
    // (ThemeMetricsDashboard が未選択時に県平均へフォールバックする)。
    return readAllYearsRankingValuesFromR2(key, "prefecture")
      .then((result) => {
        const all = isOk(result) ? result.data : [];
        const ny = yearCode.slice(0, 4);
        const values = all.filter((v) => String(v.yearCode).slice(0, 4) === ny);
        const nationalSeries = buildNationalSeries(all);
        return {
          key,
          values,
          nationalValue: undefined as number | undefined,
          nationalSeries:
            nationalSeries.length > 0 ? nationalSeries : undefined,
        };
      })
      .catch((error) => {
        logger.error({ error, key }, "テーマダッシュボード: ranking values 取得失敗 (R2)");
        return { key, values: [] as RankingValue[], nationalValue: undefined as number | undefined, nationalSeries: undefined as { year: number; value: number }[] | undefined };
      });
  });

  const [topology, ...valuesResults] = await Promise.all([
    topologyPromise,
    ...valuesPromises,
  ]);

  // 3. indicatorDataMap を構築（availableYears を含む）
  const indicatorDataMap: Record<string, ThemeIndicatorData> = {};
  for (const { key, item } of validItems) {
    const valResult = valuesResults.find((v) => v.key === key);
    const values = valResult?.values ?? [];
    if (values.length > 0) {
      indicatorDataMap[key] = {
        rankingItem: item,
        rankingValues: values,
        availableYears: item.availableYears ?? [],
        nationalValue: valResult?.nationalValue,
        nationalSeries: valResult?.nationalSeries,
      };
    }
  }

  if (Object.keys(indicatorDataMap).length === 0) return null;

  return { indicatorDataMap, topology };
}
