import data from "../../../../../data/products/packs/datasets/sewerage-penetration-rate-2012on.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 下水道普及率（2021）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー sewerage-penetration-rate-2012on)。 */
export const SEWERAGE_PENETRATION_RATE_2012ON_2021: Dataset = normalizeDataset(data as DatasetInput);
