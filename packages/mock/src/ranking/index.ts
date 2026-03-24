/**
 * Ranking Mock Data
 */

// Ranking Items
import annualSalesAmountPerEmployeeItem from "./ranking-item/annual-sales-amount-per-employee.json";
import criminalRecognitionCountItem from "./ranking-item/criminal-recognition-count.json";
import movingInExcessRateJapaneseItem from "./ranking-item/moving-in-excess-rate-japanese.json";
import retailStoresPerItem from "./ranking-item/retail-stores-per.json";

// Ranking Data
import annualSalesAmountPerEmployeeData from "./ranking-data/annual-sales-amount-per-employee.json";
import criminalRecognitionCountData from "./ranking-data/criminal-recognition-count.json";
import movingInExcessRateJapaneseData from "./ranking-data/moving-in-excess-rate-japanese.json";
import retailStoresPerData from "./ranking-data/retail-stores-per.json";

export const rankingItems = {
  "annual-sales-amount-per-employee": annualSalesAmountPerEmployeeItem,
  "criminal-recognition-count": criminalRecognitionCountItem,
  "moving-in-excess-rate-japanese": movingInExcessRateJapaneseItem,
  "retail-stores-per": retailStoresPerItem,
} as const;

export const rankingData = {
  "annual-sales-amount-per-employee": annualSalesAmountPerEmployeeData,
  "criminal-recognition-count": criminalRecognitionCountData,
  "moving-in-excess-rate-japanese": movingInExcessRateJapaneseData,
  "retail-stores-per": retailStoresPerData,
} as const;

// 個別エクスポート
export {
  annualSalesAmountPerEmployeeItem,
  criminalRecognitionCountItem,
  movingInExcessRateJapaneseItem,
  retailStoresPerItem,
  annualSalesAmountPerEmployeeData,
  criminalRecognitionCountData,
  movingInExcessRateJapaneseData,
  retailStoresPerData,
};
