import type { MetricConfig } from "../types";

export const patientReceivingRateByDisease: MetricConfig = {
  "key": "patient-receiving-rate-by-disease",
  "title": "受療率（総数・入院総数）（患者調査）",
  "subtitle": "傷病別",
  "unit": "人口10万対",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026105",
    "cdCat01": "1",
    "cdCat03": "1",
    "areaAxis": {
      "axis": "cat02",
      "scheme": "seq-pref",
    },
    "displayName": "受療率（総数・入院総数）（2023年患者調査）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026105",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  // 2026-07-30: areaAxis 是正で 47 県そろったが、傷病「総数」の入院受療率 = 入院受療率と同値のため 非公開にする。
  // 未公開 (KNOWN_RANKING_KEYS 外) だったため失う流入は無い。
  // 独自の内訳 (65歳以上 / 主要傷病 / 一般病床 等) を pin して別 metric として
  // 再定義するなら title・SEO も含めて仕様から起こす → .claude/todo/06_指標バックログ.md
  "isActive": false,
};
