import type { MetricConfig } from "../types";

export const healthMedicalExpenditureTotal: MetricConfig = {
  "key": "health-medical-expenditure-total",
  "title": "保健医療費",
  "subtitle": "都道府県庁所在市の二人以上世帯の1世帯当たり年間保健医療費（医薬品・健康保持用摂取品・医療サービスへの支出総額）",
  "description": "家計調査（二人以上世帯）における年間の保健医療への支出総額。医薬品、健康保持用摂取品、保健医療用品・器具、保健医療サービスを含む。公的保険の給付分は含まない自己負担ベースである。",
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
      "cdCat01": "060000000",
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
