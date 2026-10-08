import type { MetricConfig } from "../types";

export const consumerPriceDifferenceIndexHousing: MetricConfig = {
  "key": "consumer-price-difference-index-housing",
  "title": "消費者物価地域差指数",
  "subtitle": "住居",
  "description": "全国平均の住居価格水準を100とし、都道府県ごとの住居費目の物価水準を比較した年平均指数です。",
  "note": "住居指数にも「持家の帰属家賃」は含まれず、消費者物価指数（CPI）の住居とは対象が異なります。",
  "unit": "（全国=100）",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04417",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2013,
    "to": 2025,
  },
  "supplementalSources": [
    {
      "years": [2025],
      "source": {
        "kind": "estat",
        "statsDataId": "0003441258",
        "cdTab": "40",
        "cdCat01": "00030",
        "displayName": "小売物価統計調査（構造編）",
        "url": "https://www.e-stat.go.jp/dbview?sid=0003441258",
      },
      "reason": "社会・人口統計体系に2025年の物価地域差指数（2026-09-18公表）が未反映のため、小売物価統計調査（構造編）の表から直接取る。2013〜2024年は47都道府県×12費目の全セルが社会・人口統計体系の値と一致することを確認済み (2026-10-08)",
    },
  ],
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "消費者物価地域差指数（住居）",
  "isActive": true,
};
