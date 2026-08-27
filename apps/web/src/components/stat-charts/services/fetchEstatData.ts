import { cache } from "react";

import { buildRecipe, METRICS_REGISTRY } from "@stats47/data-configs";
import { logger } from "@stats47/logger";
import { readJapanSeries, readStatsValues } from "@stats47/stats-r2/readers";

import type { StatsSchema } from "@stats47/types";

/** 旧page_componentsをR2 metricへ解決するためだけに読む互換パラメータ。 */
export type LegacyStatParams = {
  readonly statsDataId: string;
  readonly [key: string]: string | number | undefined;
};

const RECIPE_KEYS = ["statsDataId", "cdTab", "cdCat01", "cdCat02", "cdCat03", "cdCat04", "cdCat05"] as const;
const UNSUPPORTED_FILTER_RE = /^(?:lv|cdCat(?:0[6-9]|1[0-5])|cdCat\d+(?:From|To)|cdTab(?:From|To)|cdArea(?:From|To))$/;

function recipeKey(params: LegacyStatParams): string {
  return RECIPE_KEYS
    .filter((key) => params[key] !== undefined)
    .map((key) => `${key}=${String(params[key])}`)
    .join("&");
}

const metricKeysByRecipe = (() => {
  const byRecipe = new Map<string, string[]>();
  for (const config of Object.values(METRICS_REGISTRY)) {
    const recipe = buildRecipe(config);
    if (!recipe.estatParams || recipe.derived) continue;
    const key = recipeKey(recipe.estatParams as LegacyStatParams);
    const keys = byRecipe.get(key) ?? [];
    keys.push(config.key);
    byRecipe.set(key, keys);
  }
  for (const keys of byRecipe.values()) {
    keys.sort((left, right) => {
      const activeDiff = Number(METRICS_REGISTRY[right]?.isActive) - Number(METRICS_REGISTRY[left]?.isActive);
      return activeDiff || left.localeCompare(right);
    });
  }
  return byRecipe;
})();

const cachedReadMetric = cache(async (metricKey: string) => {
  const [prefecture, japan] = await Promise.all([
    readStatsValues(metricKey, "prefecture"),
    readJapanSeries(metricKey),
  ]);
  return { prefecture, japan };
});

function candidateMetricKeys(params: LegacyStatParams): string[] {
  if (Object.keys(params).some((key) => UNSUPPORTED_FILTER_RE.test(key))) return [];
  return metricKeysByRecipe.get(recipeKey(params)) ?? [];
}

function filterRows(
  rows: StatsSchema[],
  areaCode: string | null,
  params: LegacyStatParams,
): StatsSchema[] {
  const targetArea = typeof params.cdArea === "string" ? params.cdArea : areaCode;
  const targetYear = typeof params.cdTime === "string" ? params.cdTime : null;
  const yearFrom = typeof params.cdTimeFrom === "string" ? params.cdTimeFrom : null;
  const yearTo = typeof params.cdTimeTo === "string" ? params.cdTimeTo : null;
  return rows.filter(
    (row) =>
      (targetArea === null || row.areaCode === targetArea) &&
      (targetYear === null || row.yearCode === targetYear) &&
      (yearFrom === null || row.yearCode >= yearFrom) &&
      (yearTo === null || row.yearCode <= yearTo),
  );
}

async function readCompatibleRows(
  areaCode: string | null,
  params: LegacyStatParams,
): Promise<StatsSchema[] | null> {
  const candidates = candidateMetricKeys(params);
  for (const metricKey of candidates) {
    const config = METRICS_REGISTRY[metricKey];
    const { prefecture, japan } = await cachedReadMetric(metricKey);
    if (!config || !prefecture) continue;
    const rows: StatsSchema[] = [
      ...prefecture.rows.map((row) => ({
        ...row,
        metricKey,
        unit: row.unit ?? config.unit,
      })),
      ...(japan?.rows ?? []).map((row) => ({
        areaCode: "00000",
        areaName: "全国",
        yearCode: row.yearCode,
        yearName: row.yearName,
        metricKey,
        value: row.value,
        unit: row.unit,
      })),
    ];
    const filtered = filterRows(rows, areaCode, params);
    if (filtered.length > 0) return filtered;
  }
  return null;
}

/**
 * 旧e-Stat parameter契約をMetricConfigへ決定的に逆引きし、正典R2だけを読む。
 * 未登録・曖昧な生requestは直APIへfallbackせずno-dataにする。
 */
export async function fetchEstatData(
  areaCode: string,
  params: LegacyStatParams,
): Promise<{ data: StatsSchema[] } | { error: string }> {
  try {
    const rows = await readCompatibleRows(areaCode, params);
    if (!rows) return { error: "データが見つかりません" };
    return { data: rows };
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : error, areaCode, params },
      "R2互換データ取得失敗",
    );
    return { error: "データの取得に失敗しました" };
  }
}

/** 全都道府県（利用可能なら全国系列も含む）の正典R2データを返す。 */
export async function fetchEstatDataAllAreas(
  params: LegacyStatParams,
): Promise<{ data: StatsSchema[] } | { error: string }> {
  try {
    const rows = await readCompatibleRows(null, params);
    if (!rows) return { error: "データが見つかりません" };
    return { data: rows };
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : error, params },
      "R2互換全都道府県データ取得失敗",
    );
    return { error: "データの取得に失敗しました" };
  }
}

/** 階層データのカテゴリごとにMetricConfigへ解決し、R2系列を結合する。 */
export async function fetchEstatDataWithCategories(
  areaCode: string,
  statsDataId: string,
  categoryCodes: string[],
): Promise<{ data: StatsSchema[] } | { error: string }> {
  const results = await Promise.all(
    categoryCodes.map((cdCat01) => fetchEstatData(areaCode, { statsDataId, cdCat01 })),
  );
  if (results.some((result) => "error" in result)) {
    return { error: "データが見つかりません" };
  }
  return { data: results.flatMap((result) => ("data" in result ? result.data : [])) };
}
