import type { MetricConfig } from "../types";

export const transportCommunicationExpenditureTotal: MetricConfig = {
  "key": "transport-communication-expenditure-total",
  "title": "交通・通信費",
  "subtitle": "都道府県庁所在市の二人以上世帯の1世帯当たり年間交通・通信費（交通・自動車等関係費・通信への支出総額）",
  "description": "家計調査（二人以上世帯）における年間の交通・通信への支出総額。鉄道・バス等の交通費、自動車等関係費、通信費を含む。自動車保有率と公共交通の整備状況で構成が大きく変わる。",
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
      "cdCat01": "070000000",
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
    // 1世帯当たりの年間支出額。県人口・面積で再除算しない。
    "isCalculated": false,
  },
  "isActive": true,
};
