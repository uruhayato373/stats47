import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const consumerPriceDifferenceIndexOverall: MetricConfig = {
  "key": "consumer-price-difference-index-overall",
  "title": "消費者物価地域差指数",
  "subtitle": "総合",
  "description": "全国平均の物価水準を100とし、総合の品目構成で都道府県の物価水準を比較した年平均指数です。",
  "note": "都道府県の指数は、県庁所在市だけでなく、動向編の調査市町村と構造編の地域別価格差調査の調査市 (各都道府県の人口の50%をカバーすることを目標に選定) の価格から作る都道府県の値で、同じ公表の都道府県庁所在市の指数 (東京都は東京都区部) とは別系列。2024年の総合は東京都104.0・東京都区部104.9。消費者物価指数（CPI）の総合に含まれる「持家の帰属家賃」は、この総合指数には含まれません。出典: 総務省「消費者物価地域差指数－小売物価統計調査（構造編）2024年結果－」https://www.stat.go.jp/data/kouri/kouzou/pdf/g_2024.pdf と調査の概要 https://www.stat.go.jp/data/kouri/kouzou/k_1.html (2026-11-24 確認)",
  "unit": "（全国=100）",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04414",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2013,
    "to": 2025
  },
  "supplementalSources": [
    {
      "years": [2025],
      "source": {
        "kind": "estat",
        "statsDataId": "0003441258",
        "cdTab": "40",
        "cdCat01": "00010",
        "displayName": "小売物価統計調査（構造編）",
        "url": "https://www.e-stat.go.jp/dbview?sid=0003441258",
      },
      "reason": "社会・人口統計体系に2025年の物価地域差指数（2026-09-18公表）が未反映のため、小売物価統計調査（構造編）の表から直接取る。2013〜2024年は47都道府県×12費目の全セルが社会・人口統計体系の値と一致することを確認済み (2026-10-08)",
    },
  ],
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "isActive": true
};
