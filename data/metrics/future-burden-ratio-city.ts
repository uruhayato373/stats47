import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const futureBurdenRatioCity: MetricConfig = {
  "key": "future-burden-ratio-city",
  "title": "将来負担比率（市町村財政）",
  "subtitle": "市町村分",
  // 「―」は将来負担が無いこと (東京都の健全化判断比率一覧表の備考)。R2 で行の無い団体と一覧表の「―」が都内 39 市町村で一致 (2026-10-28)
  absentValueReason: "将来負担が無く（基金などの充当可能財源が将来負担額を上回り）、比率が算定されない",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020204",
    "cdCat01": "D2212",
    "displayName": "社会・人口統計体系（市区町村データ・廃置分合処理済）",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2011,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "isActive": true,
};
