import data from "../../../../../data/products/packs/datasets/home-ownership-rate-kakei.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 持家率（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー home-ownership-rate-kakei)。 */
export const HOME_OWNERSHIP_RATE_KAKEI_2024: Dataset = normalizeDataset(data as DatasetInput);
