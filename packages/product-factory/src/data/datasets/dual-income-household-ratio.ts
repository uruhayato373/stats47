import data from "../../../../../data/products/packs/datasets/dual-income-household-ratio.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 共働き世帯割合（2020）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー dual-income-household-ratio)。 */
export const DUAL_INCOME_HOUSEHOLD_RATIO_2020: Dataset = normalizeDataset(data as DatasetInput);
