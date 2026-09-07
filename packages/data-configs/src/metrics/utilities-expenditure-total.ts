import type { MetricConfig } from "../types";

export const utilitiesExpenditureTotal: MetricConfig = {
  "key": "utilities-expenditure-total",
  "title": "光熱・水道費",
  "subtitle": "都道府県庁所在市の二人以上世帯の1世帯当たり年間光熱・水道費（電気・ガス・他の光熱・上下水道への支出総額）",
  "description": "家計調査（二人以上世帯）における年間の光熱・水道への支出総額。電気代・ガス代・灯油等・上下水道料を含み、気候と住宅事情の影響を受ける。",
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
      "cdCat01": "030000000",
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
