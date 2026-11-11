import data from "../../../../../data/products/packs/datasets/number-of-hotel-facilities.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** ホテル営業施設数（2017）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー number-of-hotel-facilities)。 */
export const NUMBER_OF_HOTEL_FACILITIES_2017: Dataset = normalizeDataset(data as DatasetInput);
