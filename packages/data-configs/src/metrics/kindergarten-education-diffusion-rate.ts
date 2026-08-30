import type { MetricConfig } from "../types";

export const kindergartenEducationDiffusionRate: MetricConfig = {
  "key": "kindergarten-education-diffusion-rate",
  "title": "教育普及度",
  "subtitle": "幼稚園",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0910101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1985,
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
  "seoTitle": "教育普及度ランキング都道府県【2020年】｜1位千葉県（51.4％）",
  "seoDescription": "2020年の教育普及度の都道府県別ランキング。1位千葉県（51.4％）、最下位福井県（7.6％）で6.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": false,
};
