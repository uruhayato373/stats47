import type { MetricConfig } from "../types";

export const departmentSupermarketSales: MetricConfig = {
  "key": "department-supermarket-sales",
  "title": "百貨店・スーパー販売額",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004032493",
    "cdCat03": "01030300",
    "cdCat01": "0110200",
    "cdCat02": "0302090",
    "displayName": "商業動態統計調査",
    "url": "https://www.meti.go.jp/statistics/tyo/syoudou/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2025,
    "to": 2025,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 0,
    "displayUnit": "億円",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "百万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "百万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "department-supermarket-sales",
  "seoTitle": "百貨店・スーパー販売額 都道府県ランキング【2025年】｜1位東京都（137,051百万円）",
  "seoDescription": "2025年の百貨店・スーパー販売額を都道府県別に比較。1位は東京都（137,051百万円）、最下位は鳥取県（4,135百万円）、最大と最小の差は33.1倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
