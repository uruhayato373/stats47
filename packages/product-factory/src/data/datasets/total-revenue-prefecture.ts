import data from "../../../../../data/products/packs/datasets/total-revenue-prefecture.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 歳入決算総額（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー total-revenue-prefecture)。 */
export const TOTAL_REVENUE_PREFECTURE_2022: Dataset = normalizeDataset(data as DatasetInput);
