import data from "../../../../../data/products/packs/datasets/active-job-opening-ratio.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 有効求人倍率（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー active-job-opening-ratio)。 */
export const ACTIVE_JOB_OPENING_RATIO_2022: Dataset = normalizeDataset(data as DatasetInput);
