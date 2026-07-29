import type { MetricConfig } from "../types";

export const singleMotherHouseholds: MetricConfig = {
  "key": "single-mother-households",
  "title": "母子世帯数",
  "unit": "世帯",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A8401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      1980,
      1985,
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020,
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
        "unit": "世帯/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "世帯/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "母子世帯数ランキング都道府県【2020年】｜1位東京都（53,043世帯）",
  "seoDescription": "2020年の母子世帯数の都道府県別ランキング。1位東京都（53,043世帯）、最下位鳥取県（3,304世帯）で16.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
