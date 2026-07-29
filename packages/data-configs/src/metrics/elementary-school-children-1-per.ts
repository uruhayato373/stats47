import type { MetricConfig } from "../types";

export const elementarySchoolChildren1Per: MetricConfig = {
  "key": "elementary-school-children-1-per",
  "title": "小学校児童数",
  "subtitle": "人口当たり",
  "unit": "人",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0510205",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
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
  "groupKey": "elementary-school-children-count",
  "seoTitle": "小学校児童数ランキング都道府県【2024年】｜1位東京都（27.9人）",
  "seoDescription": "2024年の小学校児童数の都道府県別ランキング。1位東京都（27.9人）、最下位高知県（16.2人）で1.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
