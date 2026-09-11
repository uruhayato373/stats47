import type { MetricConfig } from "../types";
import { agriculturalOutputSource } from "../provenance/official-theme-releases";

export const agriculturalOutput: MetricConfig = {
  "key": "agricultural-output",
  "title": "農業産出額",
  "unit": "百万円",
  "category": "agriculture",
  "surveyId": "agricultural-income-statistics",
  "source": agriculturalOutputSource,
  // 県の2024年公表表とは別に、公開済みcities.jsonのSSDS市区町村系列を維持する。
  // 旧source 0000010103/C3101からpage-data-batchが解決していた廃置分合処理済の市表。
  "citySource": {
    "kind": "estat",
    "statsDataId": "0000020203",
    "cdCat01": "C3101",
    "displayName": "社会・人口統計体系（市区町村データ）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0000020203",
  },
  "entities": ["prefecture", "city"],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateGreens",
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
  "description": "1月から12月の農産物の品目別生産数量に農家庭先販売価格を乗じるなどして推計した農業生産の金額。農業者の手取り所得とは異なる。",
  "note": "都道府県の2024年は生産農業所得統計の公表値（億円単位）を百万円に換算しています。2023年以前は社会・人口統計体系の百万円値で、精度が異なります。市区町村は別のSSDS市区町村系列で、掲載年は市区町村データの実年を表示します。公表順位は丸め前の値で計算されるため、ここでの同順位と異なる場合があります。",
  "seoTitle": "農業産出額ランキング都道府県",
  "seoDescription": "都道府県別の農業産出額を比較。1975年から2024年の金額と出典、単位を確認できます。",
  "isActive": true,
};
