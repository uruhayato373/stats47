import type { MetricConfig } from "../types";

export const pensionBenefitTotal: MetricConfig = {
  "key": "pension-benefit-total",
  "title": "厚生年金受給権者年金総額",
  "description": "3月31日現在の厚生年金受給権者について、裁定済みの年金額（年額）を合計した金額です。",
  "note": "年度中に実際に支給した総額ではなく、支給停止中の年金額も含みます。全国値には海外居住者分が含まれるため、都道府県合計と一致しません。",
  "unit": "千円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdCat01": "J5104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.001,
    "decimalPlaces": 0,
    "displayUnit": "万円",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "千円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "pension-benefit",
  "seoTitle": "厚生年金受給権者年金総額ランキング都道府県【2022年】｜1位東京都（2,436,032,586千円）",
  "seoDescription": "2022年の厚生年金受給権者年金総額の都道府県別ランキング。1位東京都（2,436,032,586千円）、最下位鳥取県（121,806,481千円）で20.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
