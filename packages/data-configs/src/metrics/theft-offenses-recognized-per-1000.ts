import type { MetricConfig } from "../types";

export const theftOffensesRecognizedPer1000: MetricConfig = {
  "key": "theft-offenses-recognized-per-1000",
  "title": "窃盗犯認知件数",
  "subtitle": "人口千人当たり",
  "unit": "件",
  "category": "safetyenvironment",
  "description": "犯罪統計の窃盗犯認知件数を総人口で除し、人口千人当たりに換算した値。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K06104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1978,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "theft-offenses-recognized",
  "seoTitle": "窃盗犯認知件数（人口千人当たり）ランキング都道府県",
  "seoDescription": "人口千人当たりの窃盗犯認知件数を都道府県別に比較。総数とは区別して、同じ分母の指標で地域差と経年変化を確認できます。",
  "isActive": true,
};
