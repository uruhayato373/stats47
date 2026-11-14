import "server-only";

import { fetchPrefectures, PREFECTURE_CAPITAL_CITY_NAMES } from "@stats47/area";
import { getMetricConfig, isCapitalCityValueMetric, METRICS_REGISTRY } from "@stats47/data-configs";
import { formatFeaturedValueDisplay } from "@stats47/ranking";

import type { FeaturedValue } from "@stats47/ranking/types";

const PREF_CODE_BY_NAME = new Map(fetchPrefectures().map((pref) => [pref.prefName, pref.prefCode]));

/**
 * 一覧の項目 (R2 の items.json。指標の定義の表示単位を持たない) の 1 位の値を、ランキングのページと同じ表示単位で書く
 * (「656,171,677千円」でなく「6,562億円」。関連ランキングの一覧・サイドバー・一覧の「1 位」の列が使う。2026-11-14)。
 * 定義の表示単位は指標の定義 (`display`) から引く。値の無い項目は null。
 */
export function rankingTop1Value(item: {
  rankingKey: string;
  unit: string;
  top1?: FeaturedValue | null;
}): { value: string; unit: string } | null {
  if (!item.top1?.value) return null;
  return formatFeaturedValueDisplay(
    { unit: item.unit, valueDisplay: getMetricConfig(item.rankingKey)?.display },
    item.top1.value,
  );
}

/**
 * ランキングの一覧の「1 位」の列の文字 (「鳥取県 71.5%」)。R2 の item に焼き込まれた top1 (県名 + 整形済みの値) から作る。
 * 家計調査の値は県庁所在市の値なので、1 位の名前は市で書く (問いが「都市は？」のカードと同じ規則。2026-11-03)。
 * 値はランキングのページと同じ表示単位で書く (`rankingTop1Value`)。値の無い指標は null。
 */
export function rankingTop1Label(item: {
  rankingKey: string;
  unit: string;
  top1?: FeaturedValue | null;
}): string | null {
  const top1 = item.top1;
  const shown = rankingTop1Value(item);
  if (!top1 || !shown) return null;
  const config = getMetricConfig(item.rankingKey);
  const prefCode = PREF_CODE_BY_NAME.get(top1.areaName);
  const areaName =
    config && prefCode && isCapitalCityValueMetric(config, METRICS_REGISTRY)
      ? (PREFECTURE_CAPITAL_CITY_NAMES[prefCode] ?? top1.areaName)
      : top1.areaName;
  return `${areaName} ${shown.value}${shown.unit}`;
}
