import type { MetricConfig } from "../types";

export const physicalDisabilityRehabilitationFacilityStaffPer100k: MetricConfig = {
  "key": "physical-disability-rehabilitation-facility-staff-per-100k",
  "title": "身体障害者更生援護施設従事者数",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J03301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2002,
      2003,
      2011,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
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
  "seoTitle": "身体障害者更生援護施設従事者数ランキング都道府県【2011年】｜1位高知県（48人）",
  "seoDescription": "2011年の身体障害者更生援護施設従事者数の都道府県別ランキング。1位高知県（48人）、最下位茨城県（0人）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
