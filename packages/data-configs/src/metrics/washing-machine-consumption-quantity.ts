import type { MetricConfig } from "../types";

export const washingMachineConsumptionQuantity: MetricConfig = {
  "key": "washing-machine-consumption-quantity",
  "title": "電気洗濯機消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間電気洗濯機消費量",
  "unit": "台",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348235",
      "cdCat01": "040110060",
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
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
        "unit": "台/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "台/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "電気洗濯機消費量 都道府県ランキング【2024年】｜1位福島県（0.098台）",
  "seoDescription": "2024年の電気洗濯機消費量を都道府県別に比較。1位は福島県（0.098台）、最下位は栃木県（0.010台）、最大と最小の差は9.8倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
