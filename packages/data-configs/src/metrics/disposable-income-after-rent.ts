import type { MetricConfig } from "../types";

export const disposableIncomeAfterRent: MetricConfig = {
  "key": "disposable-income-after-rent",
  "title": "家賃控除後可処分所得",
  "description": "可処分所得から民営家賃消費支出額を差し引いた手残り額。住居費を考慮した実質的な生活余力を示す。",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "external",
    "fetcherKey": "calculated",
    "config": {},
  },
  "entities": [
    "prefecture",
  ],
  // 分子 disposable-income-worker-households を 1975-2024 へ広げたのに合わせる。
  // 起点 2007 は分母 private-rent-consumption-expenditure の下限 (R2 実測 2007-2024) で、
  // 差が成立するのは両者が重なる年だけ。上限を 2024 に留めるのは分子と同じ理由 (seoTitle の実数)。
  "years": {
    "from": 2007,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "calculation": {
    "isCalculated": true,
    "type": "subtraction",
    "numeratorKey": "disposable-income-worker-households",
    "denominatorKey": "private-rent-consumption-expenditure",
  },
  "seoTitle": "家賃控除後可処分所得ランキング都道府県【2024年】｜1位山形県（545,206円）",
  "seoDescription": "2024年の家賃控除後可処分所得の都道府県別ランキング。1位山形県（545,206円）、最下位沖縄県（167,326円）で3.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
