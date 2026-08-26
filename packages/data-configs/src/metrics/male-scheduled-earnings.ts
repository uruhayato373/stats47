import type { MetricConfig } from "../types";

export const maleScheduledEarnings: MetricConfig = {
  "key": "male-scheduled-earnings",
  "title": "男性所定内給与額",
  "unit": "千円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003426933",
    "cdTab": "10",
    "cdCat03": "01",
    "cdCat04": "01",
    "cdCat01": "02",
    "cdCat02": "01",
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
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.1,
    "decimalPlaces": 1,
    "displayUnit": "万円",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "千円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "gender-wage",
  "seoTitle": "男性所定内給与額 都道府県ランキング【2022年】｜1位東京都（412.8千円）",
  "seoDescription": "2022年の男性所定内給与額を都道府県別に比較。1位は東京都（412.8千円）、最下位は青森県（267.4千円）、最大と最小の差は1.5倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
