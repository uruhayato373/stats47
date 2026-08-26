import type { MetricConfig } from "../types";

export const numberOfHotelFacilities: MetricConfig = {
  "key": "number-of-hotel-facilities",
  "title": "ホテル営業施設数",
  "unit": "施設",
  "category": "commercial",
  "description": "衛生行政報告例で、旅館業法上のホテル営業として都道府県知事または保健所設置市の市長から許可を受けた営業施設の数。",
  "note": "3月31日現在の施設数。社会・人口統計体系では都道府県系列の収集が2017年で中止されているため、現在の施設数を示す指標ではない。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3803",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1997,
      1998,
      1999,
      2000,
      2001,
      2002,
      2003,
      2004,
      2005,
      2006,
      2007,
      2008,
      2017,
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "施設/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "施設/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "ホテル営業施設数ランキング都道府県【2017年】｜1位東京都（718施設）",
  "seoDescription": "2017年のホテル営業施設数の都道府県別ランキング。1位東京都（718施設）、最下位徳島県（45施設）で16.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
