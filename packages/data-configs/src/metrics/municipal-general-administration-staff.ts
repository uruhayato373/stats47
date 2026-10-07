import type { MetricConfig } from "../types";

export const municipalGeneralAdministrationStaff: MetricConfig = {
  "key": "municipal-general-administration-staff",
  "title": "一般行政部門職員数",
  "subtitle": "市町村",
  "unit": "人",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D1202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2003,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1998,
        1999,
        2000,
        2001,
        2002,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
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
  "seoTitle": "一般行政部門職員数ランキング都道府県【2024年】｜1位東京都（76,799人）",
  "seoDescription": "2024年の一般行政部門職員数の都道府県別ランキング。1位東京都（76,799人）、最下位鳥取県（4,160人）で18.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
