import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const personsOnPublicAssistancePer1000: MetricConfig = {
  "key": "persons-on-public-assistance-per-1000",
  "title": "生活保護被保護実人員",
  "subtitle": "人口1000人当たり",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J01107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
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
  "groupKey": "persons-on-public-assistance",
  "seoTitle": "生活保護被保護実人員ランキング都道府県【2023年】｜1位大阪府（30.42人）",
  "seoDescription": "2023年の生活保護被保護実人員の都道府県別ランキング。1位大阪府（30.42人）、最下位富山県（4.23人）で7.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
