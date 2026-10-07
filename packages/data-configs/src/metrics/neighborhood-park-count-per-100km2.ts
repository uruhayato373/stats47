import type { MetricConfig } from "../types";

export const neighborhoodParkCountPer100km2: MetricConfig = {
  "key": "neighborhood-park-count-per-100km2",
  "title": "近隣公園数",
  "subtitle": "面積100km²当たり",
  "unit": "所",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H08303",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1977,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "neighborhood-park-count",
  "seoTitle": "近隣公園数ランキング都道府県【2023年】｜1位大阪府（25.79所）",
  "seoDescription": "2023年の近隣公園数の都道府県別ランキング。1位大阪府（25.79所）、最下位秋田県（0.99所）で26.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
