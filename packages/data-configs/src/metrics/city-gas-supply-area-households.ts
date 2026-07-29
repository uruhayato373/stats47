import type { MetricConfig } from "../types";

export const cityGasSupplyAreaHouseholds: MetricConfig = {
  "key": "city-gas-supply-area-households",
  "title": "都市ガス供給区域内世帯数",
  "unit": "戸",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H5203",
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
    "displayUnit": "万戸",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "戸/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "戸/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "都市ガス供給区域内世帯数ランキング都道府県【2016年】｜1位東京都（6,888,964戸）",
  "seoDescription": "2016年の都市ガス供給区域内世帯数の都道府県別ランキング。1位東京都（6,888,964戸）、最下位島根県（69,725戸）で98.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
