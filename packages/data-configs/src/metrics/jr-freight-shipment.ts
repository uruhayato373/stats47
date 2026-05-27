import type { MetricConfig } from "../types";

export const jrFreightShipment: MetricConfig = {
  "key": "jr-freight-shipment",
  "title": "ＪＲ貨物発送量",
  "unit": "トン",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3702",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2012,
      2013,
      2014,
      2015,
      2016,
      2023,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
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
        "unit": "トン/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "トン/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "トン/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "ＪＲ貨物発送量ランキング都道府県【2023年】｜1位神奈川県（4,007,584トン）",
  "seoDescription": "2023年のＪＲ貨物発送量の都道府県別ランキング。1位神奈川県（4,007,584トン）、最下位沖縄県（0トン）で地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
