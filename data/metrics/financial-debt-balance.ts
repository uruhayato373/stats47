import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const financialDebtBalance: MetricConfig = {
  "key": "financial-debt-balance",
  "title": "金融負債残高",
  "subtitle": "二人以上の世帯の1世帯当たり",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010112",
    "cdCat01": "L740101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 0.1,
    "decimalPlaces": 0,
    "displayUnit": "万円",
  },
  "calculation": {
    "isCalculated": false,
    // 1 世帯当たりの平均なので人口・面積当たりへの換算は意味が無い (METRIC-HOUSEHOLD-ASSET-SUBTITLE-01)
    "normalizationOptions": [],
  },
  "groupKey": "household-finance",
  "seoTitle": "金融負債残高ランキング都道府県【2019年】｜1位神奈川県（9,304千円）",
  "seoDescription": "2019年の金融負債残高の都道府県別ランキング。1位神奈川県（9,304千円）、最下位徳島県（3,472千円）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
