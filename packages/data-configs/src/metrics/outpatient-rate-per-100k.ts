import type { MetricConfig } from "../types";

export const outpatientRatePer100k: MetricConfig = {
  "key": "outpatient-rate-per-100k",
  "title": "外来受療率",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026104",
    "cdCat01": "1",
    "cdCat02": "1",
    "displayName": "患者調査",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/kanja/23/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "外来受療率1位は和歌山6,846人/10万、沖縄の1.5倍｜47都道府県2023",
  "seoDescription": "人口10万人あたり外来受療率は1位和歌山(6,846人)、最下位沖縄(4,528人)で1.5倍差。47都道府県を地図とグラフで比較する2023年最新ランキング。",
  "isActive": true,
};
