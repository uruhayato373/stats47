import type { MetricConfig } from "../types";

export const manufacturingIndustryAddedValue: MetricConfig = {
  "key": "manufacturing-industry-added-value",
  "title": "製造業付加価値額",
  "description": "従業者4人以上の製造業事業所について、製造品出荷額等から原材料使用額等や内国消費税等を差し引き、事業所が生み出した価値を表した金額。",
  "note": "従業者30人以上は在庫増減を加え減価償却額も控除する付加価値額、29人以下は粗付加価値額で集計する。2020年度以降は調査が年により切り替わるため時系列比較に注意。",
  "unit": "百万円",
  "category": "miningindustry",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3402",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
    "to": 2023,
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
        "unit": "百万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "百万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "製造業付加価値額ランキング都道府県【2023年】｜1位愛知県（16,257,929百万円）",
  "seoDescription": "2023年の製造業付加価値額の都道府県別ランキング。1位愛知県（16,257,929百万円）、最下位沖縄県（173,044百万円）で94.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
