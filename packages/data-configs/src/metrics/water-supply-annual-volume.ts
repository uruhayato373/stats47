import type { MetricConfig } from "../types";

export const waterSupplyAnnualVolume: MetricConfig = {
  "key": "water-supply-annual-volume",
  "title": "上水道年間給水量",
  "unit": "千m3",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H530301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.001,
    "decimalPlaces": 0,
    "displayUnit": "百万m3",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "千m3/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千m3/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "上水道年間給水量ランキング都道府県【2022年】｜1位東京都（1,550,325千m3）",
  "seoDescription": "2022年の上水道年間給水量の都道府県別ランキング。1位東京都（1,550,325千m3）、最下位鳥取県（62,141千m3）で24.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
