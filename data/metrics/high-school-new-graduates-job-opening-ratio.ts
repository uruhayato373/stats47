import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const highSchoolNewGraduatesJobOpeningRatio: MetricConfig = {
  "key": "high-school-new-graduates-job-opening-ratio",
  "title": "高等学校新規卒業者の求人倍率",
  "unit": "倍",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03304",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1977,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "高等学校新規卒業者の求人倍率 都道府県ランキング【2023年】｜1位東京都（13.63倍）",
  "seoDescription": "2023年の高等学校新規卒業者の求人倍率を都道府県別に比較。1位は東京都（13.63倍）、最下位は沖縄県（2.06倍）、最大と最小の差は6.6倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
