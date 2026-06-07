import type { MetricConfig } from "../types";

export const cityGasMeterCount: MetricConfig = {
  "key": "city-gas-meter-count",
  "title": "都市ガスメーター取付数",
  "unit": "個",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H5201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2016,
    "to": 2016,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 0,
    "displayUnit": "万個",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "個/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "個/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "都市ガスメーター取付数ランキング都道府県【2016年】｜1位東京都（7,012,793個）",
  "seoDescription": "2016年の都市ガスメーター取付数の都道府県別ランキング。1位東京都（7,012,793個）、最下位島根県（27,626個）で253.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
