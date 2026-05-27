import type { MetricConfig } from "../types";

export const prefecturalIncomePerCapita: MetricConfig = {
  "key": "prefectural-income-per-capita",
  "title": "1人当たり県民所得",
  "unit": "千円",
  "category": "local-economy",
  "source": {
    "kind": "external",
    "fetcherKey": "unknown",
    "config": {},
  },
  "entities": [
    "prefecture",
  ],
  "years": "all",
  "yearFormat": "fiscal",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
