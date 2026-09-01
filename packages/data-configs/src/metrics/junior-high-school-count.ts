import type { MetricConfig } from "../types";

export const juniorHighSchoolCount: MetricConfig = {
  "key": "junior-high-school-count",
  "title": "中学校数",
  "subtitle": "総数",
  "description": "都道府県内に所在する中学校の総数。義務教育後期課程の施設規模を示す。",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010105",
    "cdCat01": "E3101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2023,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "校/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "校/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "groupKey": "junior-high-school-count",
  "seoTitle": "中学校数ランキング都道府県【2024年】｜1位東京都（799校）",
  "seoDescription": "2024年の中学校数の都道府県別ランキング。1位東京都（799校）、最下位鳥取県（57校）で14.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
