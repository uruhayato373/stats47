import type { MetricConfig } from "../types";

export const housingExpenditureTotal: MetricConfig = {
  "key": "housing-expenditure-total",
  "title": "住居費",
  "subtitle": "都道府県庁所在市の二人以上世帯の1世帯当たり年間住居費（家賃・設備修繕など住居への支出総額）",
  "description": "家計調査（二人以上世帯）における年間の住居への支出総額。家賃地代と設備修繕・維持を含む。持ち家世帯は家賃が計上されないため、持ち家率の高い県ほど小さく出る点に注意する。",
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
      "cdCat01": "020000000",
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
