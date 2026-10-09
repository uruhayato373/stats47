import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const freshFruitConsumptionQuantity: MetricConfig = {
  "key": "fresh-fruit-consumption-quantity",
  "title": "生鮮果物消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間生鮮果物消費量（合計）",
  "note": "値は都道府県庁所在市（二人以上世帯）のもので、県全体の値ではない。果物加工品は含まない。",
  "description": "家計調査（二人以上の世帯）の生鮮果物 14 品目（りんご・みかん・オレンジ・他の柑きつ類・梨・ぶどう・柿・桃・すいか・メロン・いちご・バナナ・キウイフルーツ・他の果物）の年間購入数量を合算した値。",
  "unit": "g",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348235",
      // 14 品目を合算 (家計調査の数量表に当該中分類の総数コードは無い。全品目は同じ数量表で既存 metric が取り込み済み)
      "axisSum": {
        "axis": "cat01",
        "codes": ["010610010", "010610020", "010610040", "010610050", "010610060", "010610070", "010610080", "010610090", "010610100", "010610110", "010610120", "010610130", "010610140", "010610150"],
      },
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "g/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "g/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "isActive": true,
};
