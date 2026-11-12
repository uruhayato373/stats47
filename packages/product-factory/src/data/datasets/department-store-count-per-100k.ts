import data from "../../../../../data/products/packs/datasets/department-store-count-per-100k.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 人口10万人当たり百貨店数（2006）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー department-store-count-per-100k)。 */
export const DEPARTMENT_STORE_COUNT_PER_100K_2006: Dataset = normalizeDataset(data as DatasetInput);
