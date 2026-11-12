import data from "../../../../../data/products/packs/datasets/annual-income-per-household.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 1世帯当たり年間収入（2019）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー annual-income-per-household)。 */
export const ANNUAL_INCOME_PER_HOUSEHOLD_2019: Dataset = normalizeDataset(data as DatasetInput);
