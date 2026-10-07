import type { MetricConfig } from "../types";

export const seniorWelfareCenterCountPer100k65plus: MetricConfig = {
  "key": "senior-welfare-center-count-per-100k-65plus",
  "title": "老人福祉センター数",
  "unit": "所",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J02202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2017,
  },
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
  "seoTitle": "老人福祉センター数ランキング都道府県【2017年】｜1位鳥取県（13.1所）",
  "seoDescription": "2017年の老人福祉センター数の都道府県別ランキング。1位鳥取県（13.1所）、最下位和歌山県（0.7所）で18.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
