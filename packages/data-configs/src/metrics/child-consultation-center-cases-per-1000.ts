import type { MetricConfig } from "../types";

export const childConsultationCenterCasesPer1000: MetricConfig = {
  "key": "child-consultation-center-cases-per-1000",
  "title": "児童相談所受付件数",
  "subtitle": "人口1000人当たり",
  "unit": "件",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J05210",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
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
    "decimalPlaces": 1,
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
  "groupKey": "child-consultation-center-cases",
  "seoTitle": "児童相談所受付件数ランキング都道府県【2023年】｜1位宮城県（7.9件）",
  "seoDescription": "2023年の児童相談所受付件数の都道府県別ランキング。1位宮城県（7.9件）、最下位大分県（1.6件）で4.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
