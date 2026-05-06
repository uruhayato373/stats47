import rankingDataSample from "./ranking-data-sample.json";
import rankingItemSample from "./ranking-item-sample.json";

export const rankingItems = {
  "annual-sales-amount-per-employee": rankingItemSample,
} as const;

export const rankingData = {
  "annual-sales-amount-per-employee": rankingDataSample,
} as const;
