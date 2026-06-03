import type { MetricConfig } from "../types";

export const laborForcePopulationRatioWoman: MetricConfig = {
  "key": "labor-force-population-ratio-woman",
  "title": "労働力人口比率",
  "subtitle": "女性",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0110102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
  },
  "seoTitle": "労働力人口比率ランキング都道府県【2020年】｜1位福井県（54.5％）",
  "seoDescription": "2020年の労働力人口比率の都道府県別ランキング。1位福井県（54.5％）、最下位大阪府（43.9％）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
