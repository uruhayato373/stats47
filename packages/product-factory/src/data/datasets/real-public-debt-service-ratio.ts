import data from "../../../../../data/products/packs/datasets/real-public-debt-service-ratio.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 実質公債費比率（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー real-public-debt-service-ratio)。 */
export const REAL_PUBLIC_DEBT_SERVICE_RATIO_2022: Dataset = normalizeDataset(data as DatasetInput);
