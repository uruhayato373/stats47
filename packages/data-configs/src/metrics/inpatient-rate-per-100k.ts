import type { MetricConfig } from "../types";

export const inpatientRatePer100k: MetricConfig = {
  "key": "inpatient-rate-per-100k",
  "title": "入院受療率",
  "subtitle": "人口10万人当たり",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026104",
    "cdCat01": "1",
    "cdCat02": "1",
    "cdCat04": "1",
    "areaAxis": {
      "axis": "cat03",
      "scheme": "seq-pref",
    },
    "displayName": "患者調査",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/kanja/23/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
  "seoTitle": "入院受療率1位は高知1,785人/10万、神奈川の2.7倍｜47都道府県2023",
  "seoDescription": "人口10万人あたり入院受療率は1位高知(1,785人)、2位鹿児島(1,743人)、3位長崎(1,651人)。最下位神奈川(665人)まで2.7倍差を47都道府県で比較する2023年最新ランキング。",
  "isActive": true,
};
