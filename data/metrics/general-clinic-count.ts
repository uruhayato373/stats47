import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const generalClinicCount: MetricConfig = {
  "key": "general-clinic-count",
  "title": "一般診療所数",
  "subtitle": "総数",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I5102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "supplementalSources": [
    {
      "years": [2024],
      "source": {
        "kind": "estat",
        "statsDataId": "0004048420",
        "cdCat01": "1",
        "cdCat03": "1",
        "areaAxis": { "axis": "cat02", "scheme": "name" },
        "displayName": "医療施設調査",
        "url": "https://www.mhlw.go.jp/toukei/list/79-1.html",
      },
      "reason": "社会・人口統計体系 (0000010109) は医療施設調査の項目が 2023 年で止まるため、原典の医療施設 (静態・動態) 調査の 2024 年の第21表 一般診療所数 (開設者・都道府県・病床の有無別)から取る。開設者は総数。都道府県が分類軸にあるので areaAxis で県に写す。2023 年版の同じ表 (2024 年は 0004048420、2023 年は同名の表) の 47 都道府県の値が SSDS の 2023 年の値とすべて一致することを 2026-11-23 に確かめた (DATA-MEDICAL-FACILITY-SOURCE-01)",
    },
  ],
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "施設/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "施設/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "series",
        "metric": "general-clinic-count-per-100km2",
        "label": "面積100km²当たり",
      },
    ],
    "isCalculated": false,
  },
  "groupKey": "general-clinic-count",
  "isActive": true,
};
