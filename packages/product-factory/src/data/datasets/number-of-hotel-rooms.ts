import data from "../../../../../data/products/packs/datasets/number-of-hotel-rooms.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** ホテル営業施設客室数（2017）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー number-of-hotel-rooms)。 */
export const NUMBER_OF_HOTEL_ROOMS_2017: Dataset = normalizeDataset(data as DatasetInput);
