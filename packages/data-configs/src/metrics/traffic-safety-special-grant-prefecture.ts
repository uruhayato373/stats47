import type { MetricConfig } from "../types";

export const trafficSafetySpecialGrantPrefecture: MetricConfig = {
  "key": "traffic-safety-special-grant-prefecture",
  "title": "交通安全対策特別交付金",
  "subtitle": "都道府県財政",
  "unit": "千円",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D310104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2000,
      2001,
      2002,
      2003,
      2004,
      2005,
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2022,
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
  "seoTitle": "交通安全対策特別交付金ランキング都道府県【2022年】｜1位東京都（2,700,289）",
  "seoDescription": "2022年の交通安全対策特別交付金の都道府県別ランキング。1位東京都（2,700,289）、最下位鳥取県（115,361）で23.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
