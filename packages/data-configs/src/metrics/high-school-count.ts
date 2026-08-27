import type { MetricConfig } from "../types";

export const highSchoolCount: MetricConfig = {
  "key": "high-school-count",
  "title": "高等学校数",
  "subtitle": "総数",
  "description": "都道府県内に所在する高等学校の総数。後期中等教育施設の供給規模を示す。",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010105",
    "cdCat01": "E4101",
    "displayName": "社会・人口統計体系",
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
  "groupKey": "high-school-count",
  "seoTitle": "高等学校数ランキング都道府県【2024年】｜1位東京都（429校）",
  "seoDescription": "2024年の高等学校数の都道府県別ランキング。1位東京都（429校）、最下位鳥取県（32校）で13.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
