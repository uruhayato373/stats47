import type { MetricConfig } from "../types";

export const selfServiceStoreCount: MetricConfig = {
  "key": "self-service-store-count",
  "title": "セルフサービス事業所数",
  "subtitle": "総数",
  "unit": "所",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H6105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1982,
      1985,
      1988,
      1991,
      1994,
      1997,
      1999,
      2002,
      2004,
      2007,
      2011,
      2014,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "self-service-store-count",
  "seoTitle": "セルフサービス事業所数ランキング都道府県【2014年】｜1位東京都（12,930所）",
  "seoDescription": "2014年のセルフサービス事業所数の都道府県別ランキング。1位東京都（12,930所）、最下位鳥取県（663所）で19.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
