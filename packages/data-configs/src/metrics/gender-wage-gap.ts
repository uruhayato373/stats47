import type { MetricConfig } from "../types";

export const genderWageGap: MetricConfig = {
  "key": "gender-wage-gap",
  "title": "男女間賃金格差（女性/男性）",
  "unit": "%",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003426933",
    "displayName": "賃金構造基本統計調査",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateRdYlBu",
    "colorSchemeType": "diverging",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": true,
    "calculationType": "ratio",
    "numeratorRankingKey": "female-scheduled-earnings",
    "denominatorRankingKey": "male-scheduled-earnings",
    "formula": "(numerator / denominator) * 100",
  },
  "groupKey": "gender-wage",
  "seoTitle": "男女間賃金格差（女性/男性）ランキング都道府県【2022年】｜1位愛媛県（89.7%）",
  "seoDescription": "2022年の男女間賃金格差（女性/男性）の都道府県別ランキング。1位愛媛県（89.7%）、最下位宮城県（67.5%）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
