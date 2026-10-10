import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const privateLifeInsuranceContractsPer1000: MetricConfig = {
  "key": "private-life-insurance-contracts-per-1000",
  "title": "民間生命保険保有契約件数",
  "subtitle": "人口1000人当たり",
  "unit": "件",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K10101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1982,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
        1981,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
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
  "groupKey": "private-life-insurance-contracts",
  "seoTitle": "民間生命保険保有契約件数ランキング都道府県【2024年】｜1位東京都（12,718.9件）",
  "seoDescription": "2024年の民間生命保険保有契約件数の都道府県別ランキング。1位東京都（12,718.9件）、最下位沖縄県（1,198.6件）で10.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
