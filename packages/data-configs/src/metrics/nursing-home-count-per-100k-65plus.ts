import type { MetricConfig } from "../types";

export const nursingHomeCountPer100k65plus: MetricConfig = {
  "key": "nursing-home-count-per-100k-65plus",
  "title": "老人ホーム数",
  "unit": "所",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J022011",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1999,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1997,
        1998,
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
  "seoTitle": "老人ホーム数ランキング都道府県【2023年】｜1位宮崎県（183.2所）",
  "seoDescription": "2023年の老人ホーム数の都道府県別ランキング。1位宮崎県（183.2所）、最下位滋賀県（45所）で4.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
