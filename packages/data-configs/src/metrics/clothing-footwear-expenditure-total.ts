import type { MetricConfig } from "../types";

export const clothingFootwearExpenditureTotal: MetricConfig = {
  "key": "clothing-footwear-expenditure-total",
  "title": "被服及び履物費",
  "subtitle": "都道府県庁所在市の二人以上世帯の1世帯当たり年間被服及び履物費（衣類・下着・履物・洗濯代などへの支出総額）",
  "description": "家計調査（二人以上世帯）における年間の被服及び履物への支出総額。和洋服、シャツ・セーター類、下着類、履物類、被服関連サービスを含む。",
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
      "cdCat01": "050000000",
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
