import type { MetricConfig } from "../types";

export const earlyNeonatalDeaths: MetricConfig = {
  "key": "early-neonatal-deaths",
  "title": "早期新生児死亡数",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A4272",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1996,
      1997,
      1998,
      1999,
      2000,
      2001,
      2002,
      2003,
      2004,
      2005,
      2006,
      2007,
      2023,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
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
  "seoTitle": "早期新生児死亡数ランキング都道府県【2023年】｜1位神奈川県（47人）",
  "seoDescription": "2023年の早期新生児死亡数の都道府県別ランキング。1位神奈川県（47人）、最下位高知県（1人）で47.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
