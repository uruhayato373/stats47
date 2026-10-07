import type { MetricConfig } from "../types";

export const smokeEmissionFacilityCount: MetricConfig = {
  "key": "smoke-emission-facility-count",
  "title": "ばい煙発生施設数",
  "unit": "件",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K09210",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1987,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1985,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "ばい煙発生施設数ランキング都道府県【2023年】｜1位北海道（15,438件）",
  "seoDescription": "2023年のばい煙発生施設数の都道府県別ランキング。1位北海道（15,438件）、最下位鳥取県（994件）で15.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
