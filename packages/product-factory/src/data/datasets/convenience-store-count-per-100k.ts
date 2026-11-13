import data from "../../../../../data/products/packs/datasets/convenience-store-count-per-100k.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 人口10万人当たりコンビニエンスストア数（2014）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー convenience-store-count-per-100k)。 */
export const CONVENIENCE_STORE_COUNT_PER_100K_2014: Dataset = normalizeDataset(data as DatasetInput);
