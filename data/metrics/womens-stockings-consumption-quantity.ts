import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const womensStockingsConsumptionQuantity: MetricConfig = {
  "key": "womens-stockings-consumption-quantity",
  "title": "婦人用ストッキング購入数量",
  "note": "値は都道府県庁所在市（二人以上世帯）の年間値で、県全体の値ではない。2025年1月の品目分類改定でストッキングは「他の被服のその他」(品目番号659) に統合されたため、この指標は2024年が最終の値 (総務省「収支項目分類及びその内容例示」2025年改定)",
  "unit": "足",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348235",
      "cdCat01": "050600060",
      "cdCat02": "03",
    },
    "displayName": "家計調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2007,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "婦人用ストッキング購入数量ランキング都道府県【2024年】｜1位富山県（1.5足）",
  "seoDescription": "2024年の婦人用ストッキング購入数量の都道府県別ランキング。1位富山県（1.5足）、最下位愛媛県（0.4足）で3.8倍の格差。地図やグラフで47都道府県を比較。",
  "seriesEnd": { "lastYear": 2024, "reason": "家計調査の 2025 年の品目分類の改定で「他の被服のその他」に統合され、単独の品目でなくなった" },
  "isActive": true,
};
