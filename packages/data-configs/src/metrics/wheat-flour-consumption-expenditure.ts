import type { MetricConfig } from "../types";

export const wheatFlourConsumptionExpenditure: MetricConfig = {
  "key": "wheat-flour-consumption-expenditure",
  "title": "小麦粉消費支出額",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間小麦粉消費支出額",
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
      "cdCat01": "010140010",
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
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "小麦粉消費支出額ランキング都道府県【2024】1位は消費量首位の三重でなく岐阜?",
  "seoDescription": "小麦粉に最もお金をかける県は?──消費量1位の三重ではなく岐阜県(1,042円)。2位三重(912円)、3位福岡(900円)、最下位山梨(482円)で2.2倍の格差。量と金額で首位が入れ替わる2024年の支出額ランキングを47都道府県で比較。",
  "isActive": true,
};
