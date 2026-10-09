import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const vegetableCultivationArea: MetricConfig = {
  "key": "vegetable-cultivation-area",
  "title": "野菜作付面積 都道府県別合計（だいこん）",
  "unit": "ha",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003423836",
    "cdTab": "01",
    "cdCat01": "001",
    "displayName": "野菜作付面積 都道府県別合計（だいこん, 2019年）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003423836",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "isActive": true,
};
