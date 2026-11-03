import "server-only";

import { fetchPrefectures, PREFECTURE_CAPITAL_CITY_NAMES } from "@stats47/area";
import { getMetricConfig, isCapitalCityValueMetric, METRICS_REGISTRY } from "@stats47/data-configs";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import type { FeaturedValue } from "@stats47/ranking/types";

const PREF_CODE_BY_NAME = new Map(fetchPrefectures().map((pref) => [pref.prefName, pref.prefCode]));

/**
 * ランキングの一覧の「1 位」の列の文字 (「鳥取県 71.5%」)。R2 の item に焼き込まれた top1 (県名 + 整形済みの値) から作る。
 * 家計調査の値は県庁所在市の値なので、1 位の名前は市で書く (問いが「都市は？」のカードと同じ規則。2026-11-03)。
 * 値の無い指標は null。
 */
export function rankingTop1Label(item: {
  rankingKey: string;
  unit: string;
  top1?: FeaturedValue | null;
}): string | null {
  const top1 = item.top1;
  if (!top1?.value) return null;
  const config = getMetricConfig(item.rankingKey);
  const prefCode = PREF_CODE_BY_NAME.get(top1.areaName);
  const areaName =
    config && prefCode && isCapitalCityValueMetric(config, METRICS_REGISTRY)
      ? (PREFECTURE_CAPITAL_CITY_NAMES[prefCode] ?? top1.areaName)
      : top1.areaName;
  return `${areaName} ${top1.value}${formatUnitForDisplay(item.unit)}`;
}
