import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const gyozaFrozenConsumptionExpenditure: MetricConfig = {
  "key": "gyoza-frozen-consumption-expenditure",
  "title": "ぎょうざ消費支出額",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間ぎょうざ消費支出額（冷凍品を除く）",
  "note": "家計調査の「ぎょうざ」は「他の調理食品」の一品目で、県庁所在市の二人以上世帯が購入したぎょうざ（生も含む）の支出額。冷凍品は別品目の「冷凍調理食品」、飲食店での食事は外食の別品目に入り、この値には含まれない（総務省 収支項目分類 2025年改定。2020年改定でも同じ）。対象は県庁所在市のみで県全体の値ではない。浜松市は政令指定都市で静岡県の県庁所在市ではないため、このランキングには入らない。報道でいう「餃子日本一」は総務省が公表する県庁所在市と政令指定都市の52市の比較で、3年平均で示されることが多い",
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
      "cdCat01": "010920070",
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
  "seoTitle": "餃子（ぎょうざ）の支出額ランキング｜県庁所在市の二人以上世帯",
  "seoDescription": "家計調査の二人以上世帯について、県庁所在市の餃子（ぎょうざ）への年間支出額を比較。浜松市は政令市のため対象外で、報道の「餃子日本一」(52市・3年平均)とは集計が違う点も確認できます。",
  "isActive": true,
};
