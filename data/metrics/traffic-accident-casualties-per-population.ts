import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const trafficAccidentCasualtiesPerPopulation: MetricConfig = {
  "key": "traffic-accident-casualties-per-population",
  "title": "交通事故死傷者数",
  "subtitle": "人口当たり",
  "unit": "人",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K04105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
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
  "groupKey": "traffic-accident-casualties-per-100-accidents",
  "seoTitle": "交通事故死傷者数ランキング都道府県【2024年】｜1位静岡県（622.9人）",
  "seoDescription": "2024年の交通事故死傷者数の都道府県別ランキング。1位静岡県（622.9人）、最下位島根県（123.1人）で5.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
