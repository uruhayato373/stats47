import type { MetricConfig } from "../types";

export const floorAreaNewRentedDwelling: MetricConfig = {
  "key": "floor-area-new-rented-dwelling",
  "title": "着工新設貸家住宅の床面積",
  "unit": "ｍ2",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H0210703",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1977,
    "to": 2024,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "ｍ2/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｍ2/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "着工新設貸家住宅の床面積ランキング都道府県【2024年】｜1位奈良県（60.2ｍ2）",
  "seoDescription": "2024年の着工新設貸家住宅の床面積の都道府県別ランキング。1位奈良県（60.2ｍ2）、最下位岩手県（42.7ｍ2）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
