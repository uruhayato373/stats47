import data from "../../../../../data/products/packs/datasets/residential-land-price-change-rate.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 住宅地地価変動率（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー residential-land-price-change-rate)。 */
export const RESIDENTIAL_LAND_PRICE_CHANGE_RATE_2024: Dataset = normalizeDataset(data as DatasetInput);
