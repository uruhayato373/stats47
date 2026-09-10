import type { MetricConfig } from "../types";

export const denselyInhabitedDistrictPopulationDensity: MetricConfig = {
  "key": "densely-inhabited-district-population-density",
  "title": "人口集中地区人口密度",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A01403",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
    "city"
  ],
  "years": {
    "years": [
      2000,
      2005,
      2010,
      2015,
      2020
    ]
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "人口集中地区人口密度ランキング都道府県【2020年】｜1位東京都（12,680.2人）",
  "seoDescription": "2020年の人口集中地区人口密度の都道府県別ランキング。1位東京都（12,680.2人）、最下位山口県（3,179.4人）で4.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "subtitle": "人口集中地区面積1km²当たり"
};
