import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const physicalDisabilityRehabilitationFacilityResidentsPer100k: MetricConfig = {
  "key": "physical-disability-rehabilitation-facility-residents-per-100k",
  "title": "身体障害者更生援護施設在所者数",
  "subtitle": "人口10万人当たり",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J04302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1978,
    "to": 2011,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "isReversed": false,
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
  "groupKey": "physical-disability-rehabilitation-facility-residents",
  "seoTitle": "身体障害者更生援護施設在所者数ランキング都道府県【2011年】｜1位高知県（82.5人）",
  "seoDescription": "2011年の身体障害者更生援護施設在所者数の都道府県別ランキング。1位高知県（82.5人）、最下位茨城県（0人）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
