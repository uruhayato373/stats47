import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const autoLiabilityInsuranceAmountReceivedPerPayment: MetricConfig = {
  "key": "auto-liability-insurance-amount-received-per-payment",
  "title": "自動車損害賠償責任保険受取保険金額",
  "unit": "万円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K10403",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1994,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "isReversed": false,
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
        "unit": "万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "自動車損害賠償責任保険受取保険金額ランキング都道府県【2023年】｜1位大阪府（72.9万円）",
  "seoDescription": "2023年の自動車損害賠償責任保険受取保険金額の都道府県別ランキング。1位大阪府（72.9万円）、最下位島根県（50.6万円）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
