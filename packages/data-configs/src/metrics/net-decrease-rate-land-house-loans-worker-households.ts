import type { MetricConfig } from "../types";

export const netDecreaseRateLandHouseLoansWorkerHouseholds: MetricConfig = {
  "key": "net-decrease-rate-land-house-loans-worker-households",
  "title": "土地家屋借金純減率",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02736",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1979,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "土地家屋借金純減率ランキング都道府県【2024年】｜1位大阪府（9.6％）",
  "seoDescription": "2024年の土地家屋借金純減率の都道府県別ランキング。1位大阪府（9.6％）、最下位石川県（-6.4％）で-1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
