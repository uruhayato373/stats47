import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const buildingFireDamageAmountPerPerson: MetricConfig = {
  "key": "building-fire-damage-amount-per-person",
  "title": "建物火災損害額",
  "subtitle": "人口当たり",
  "unit": "円",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K02205",
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
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "building-fire-damage-amount-per-building-fire",
  "seoTitle": "建物火災損害額ランキング都道府県【2023年】｜1位秋田県（1,946円）",
  "seoDescription": "2023年の建物火災損害額の都道府県別ランキング。1位秋田県（1,946円）、最下位沖縄県（250円）で7.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
