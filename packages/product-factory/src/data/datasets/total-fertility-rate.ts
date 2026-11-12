import data from "../../../../../data/products/packs/datasets/total-fertility-rate.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 合計特殊出生率（2023）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー total-fertility-rate)。 */
export const TOTAL_FERTILITY_RATE_2023: Dataset = normalizeDataset(data as DatasetInput);
