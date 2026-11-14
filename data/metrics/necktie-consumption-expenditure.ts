import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const necktieConsumptionExpenditure: MetricConfig = {
  "key": "necktie-consumption-expenditure",
  "title": "ネクタイ消費支出額",
  "note": "値は都道府県庁所在市（二人以上世帯）の年間値で、県全体の値ではない。2025年1月の品目分類改定でネクタイは「他の被服のその他」(品目番号659) に統合されたため、この指標は2024年が最終の値 (総務省「収支項目分類及びその内容例示」2025年改定)",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348239",
      "cdCat01": "050600020",
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
  "seoTitle": "ネクタイ消費支出額ランキング都道府県【2024年】｜1位熊本県（1,265円）",
  "seoDescription": "2024年のネクタイ消費支出額の都道府県別ランキング。1位熊本県（1,265円）、最下位滋賀県（6円）で210.8倍の格差。地図やグラフで47都道府県を比較。",
  "seriesEnd": { "lastYear": 2024, "reason": "家計調査の 2025 年の品目分類の改定で「他の被服のその他」に統合され、単独の品目でなくなった" },
  "isActive": true,
};
