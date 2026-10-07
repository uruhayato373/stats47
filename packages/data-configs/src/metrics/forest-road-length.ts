import type { MetricConfig } from "../types";

export const forestRoadLength: MetricConfig = {
  "key": "forest-road-length",
  "title": "林道延長",
  "unit": "ｋｍ",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3114",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1989,
    "to": 2022,
  },
  "yearExclusions": [
    {
      "years": [
        1980,
        1981,
        1982,
        1983,
        1984,
        1985,
        1986,
        1987,
        1988,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "ｋｍ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｋｍ/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "林道延長ランキング都道府県【2022年】｜1位北海道（24,093ｋｍ）",
  "seoDescription": "2022年の林道延長の都道府県別ランキング。1位北海道（24,093ｋｍ）、最下位沖縄県（300ｋｍ）で80.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
