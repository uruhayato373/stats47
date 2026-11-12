import data from "../../../../../data/products/packs/datasets/social-increase-rate.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 社会増減率（‰）（2019）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー social-increase-rate)。 */
export const SOCIAL_INCREASE_RATE_2019: Dataset = normalizeDataset(data as DatasetInput);
