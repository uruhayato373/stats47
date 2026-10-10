import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const fireDamageCasualtiesPerPopulation: MetricConfig = {
  "key": "fire-damage-casualties-per-population",
  "title": "火災死傷者数",
  "subtitle": "人口10万人当たり",
  "unit": "人",
  "category": "safetyenvironment",
  "description": "火災死傷者数を総人口で除し、人口10万人当たりに換算した値。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K02203",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "fire-damage-casualties-per-accident",
  "seoTitle": "火災死傷者数（人口10万人当たり）ランキング都道府県",
  "seoDescription": "人口10万人当たりの火災死傷者数を都道府県別に比較。総数とは区別して、同じ分母の指標で地域差と経年変化を確認できます。",
  "isActive": true,
};
