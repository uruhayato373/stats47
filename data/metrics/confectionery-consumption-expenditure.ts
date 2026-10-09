import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const confectioneryConsumptionExpenditure: MetricConfig = {
  "key": "confectionery-consumption-expenditure",
  "title": "菓子類消費支出額",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間菓子類消費支出額",
  "note": "値は都道府県庁所在市（二人以上世帯）のもので、県全体の値ではない。",
  "description": "家計調査（二人以上の世帯）の菓子類（和生菓子・洋生菓子・せんべい・ビスケット・スナック菓子・キャンデー・チョコレート・アイスクリーム等）の年間支出額。",
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
      "cdCat01": "010800000",
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
    "colorScheme": "interpolateOranges",
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
  "isActive": true,
};
