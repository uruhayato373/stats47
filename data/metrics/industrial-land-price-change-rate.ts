import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const industrialLandPriceChangeRate: MetricConfig = {
  "key": "industrial-land-price-change-rate",
  "title": "標準価格変動率（工業地）",
  "unit": "%",
  "category": "miningindustry",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C5505",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": "all",
  "yearFormat": "fiscal",
  "seoTitle": "標準価格（対前年平均変動率）（工業地）",
  "isActive": true,
};
