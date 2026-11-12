import data from "../../../../../data/products/packs/datasets/independent-revenue-prefecture.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 自主財源額（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー independent-revenue-prefecture)。 */
export const INDEPENDENT_REVENUE_PREFECTURE_2022: Dataset = normalizeDataset(data as DatasetInput);
