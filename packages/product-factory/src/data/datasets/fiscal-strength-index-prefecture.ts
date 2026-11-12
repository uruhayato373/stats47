import data from "../../../../../data/products/packs/datasets/fiscal-strength-index-prefecture.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 財政力指数（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー fiscal-strength-index-prefecture)。 */
export const FISCAL_STRENGTH_INDEX_PREFECTURE_2022: Dataset = normalizeDataset(data as DatasetInput);
