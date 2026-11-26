import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const bookMagazineRetailAnnualSales: MetricConfig = {
  "key": "book-magazine-retail-annual-sales",
  "title": "書籍・雑誌小売業年間商品販売額",
  "subtitle": "総額",
  "unit": "円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    // e-Stat 原単位 百万円 → config unit 円 の換算 (MONEY-UNIT-SCALE-01)。
    // 宣言しないと 百万円 の値に 円 のラベルが付いたまま配信される。
    "valueScale": 1000000,
    "cdCat01": "G5109",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1975,
      1978,
      1981,
      1984,
      1987,
      1990,
      1993,
      1996,
      2001,
      2006,
    ],
  },
  "yearFormat": "fiscal",
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
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "円/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "円/100km²",
        "decimalPlaces": 2,
      },
      {
        "type": "series",
        "metric": "book-magazine-retail-annual-sales-per-capita",
        "label": "1人当たり",
      },
    ],
  },
  "groupKey": "book-magazine-retail-annual-sales",
  "isActive": true,
};
