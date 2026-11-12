import data from "../../../../../data/products/packs/datasets/laspeyres-index-prefecture.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** ラスパイレス指数（2025）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー laspeyres-index-prefecture)。 */
export const LASPEYRES_INDEX_PREFECTURE_2025: Dataset = normalizeDataset(data as DatasetInput);
