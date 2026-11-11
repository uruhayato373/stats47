import data from "../../../../../data/products/packs/datasets/aging-index.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 老年化指数（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー aging-index)。 */
export const AGING_INDEX_2022: Dataset = normalizeDataset(data as DatasetInput);
