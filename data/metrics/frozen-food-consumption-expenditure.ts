import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const frozenFoodConsumptionExpenditure: MetricConfig = {
  "key": "frozen-food-consumption-expenditure",
  "title": "冷凍調理食品消費支出額",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間冷凍調理食品消費支出額",
  "description": "家計調査で、都道府県庁所在市（東京都は区部）の二人以上の世帯が1年間に冷凍調理食品に支出した1世帯当たりの金額。県全体の値ではない。",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0004023605",
      "cdCat01": "010920100",
      "cdCat02": "03",
    },
    "displayName": "家計調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
    "to": 2025,
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
  "seoTitle": "冷凍調理食品消費支出額ランキング｜県庁所在市の二人以上世帯",
  "seoDescription": "家計調査の二人以上世帯について、県庁所在市の冷凍調理食品消費支出額を比較。各都市の値、対象年、出典と集計上の注意を確認できます。",
  "isActive": true,
};
