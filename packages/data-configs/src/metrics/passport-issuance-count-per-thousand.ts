import type { MetricConfig } from "../types";

export const passportIssuanceCountPerThousand: MetricConfig = {
  "key": "passport-issuance-count-per-thousand",
  "title": "一般旅券発行件数",
  "unit": "件",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G0430501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1985,
        1986,
        1987,
        1988,
        1989,
        1990,
        1991,
        1992,
        1993,
        1994,
        1995,
        1996,
        1997,
        1998,
        1999,
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
    "decimalPlaces": 1,
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
  "seoTitle": "一般旅券発行件数ランキング都道府県【2024年】｜1位東京都（50.9件）",
  "seoDescription": "2024年の一般旅券発行件数の都道府県別ランキング。1位東京都（50.9件）、最下位秋田県（10.3件）で4.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
