import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const elementarySchoolTeachersRatioFemale: MetricConfig = {
  "key": "elementary-school-teachers-ratio-female",
  "title": "小学校教員割合",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0410201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2024,
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
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "小学校教員割合ランキング都道府県【2024年】｜1位広島県（68.3％）",
  "seoDescription": "2024年の小学校教員割合の都道府県別ランキング。1位広島県（68.3％）、最下位北海道（54.9％）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
