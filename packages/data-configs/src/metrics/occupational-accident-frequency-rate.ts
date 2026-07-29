import type { MetricConfig } from "../types";

export const occupationalAccidentFrequencyRate: MetricConfig = {
  "key": "occupational-accident-frequency-rate",
  "title": "労働災害度数率",
  "subtitle": "100万延べ実労働時間あたりの労働災害死傷者数",
  "unit": "（件/百万時間）",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003385946",
    "cdCat01": "100",
    "cdCat02": "S100",
    "displayName": "労働災害動向調査",
    "url": "https://www.mhlw.go.jp/toukei/list/89-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "労働災害度数率ランキング都道府県【2024年】｜1位北海道（3.87）",
  "seoDescription": "2024年の労働災害度数率の都道府県別ランキング。1位北海道（3.87）、最下位山口県（1.17）で3.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
