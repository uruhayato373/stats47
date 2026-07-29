import type { MetricConfig } from "../types";

export const tatamiPerDwellingOwner: MetricConfig = {
  "key": "tatami-per-dwelling-owner",
  "title": "持ち家住宅の居住室の畳数",
  "unit": "畳",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H0210201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1978,
      1983,
      1988,
      1993,
      1998,
      2003,
      2008,
      2013,
      2018,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "畳/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "畳/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "持ち家住宅の居住室の畳数ランキング都道府県【2023年】｜1位富山県（53.16畳）",
  "seoDescription": "2023年の持ち家住宅の居住室の畳数の都道府県別ランキング。1位富山県（53.16畳）、最下位東京都（34.35畳）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
