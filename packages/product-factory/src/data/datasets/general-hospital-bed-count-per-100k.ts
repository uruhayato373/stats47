import data from "../../../../../data/products/packs/datasets/general-hospital-bed-count-per-100k.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 人口10万人当たり一般病院病床数（2023）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー general-hospital-bed-count-per-100k)。 */
export const GENERAL_HOSPITAL_BED_COUNT_PER_100K_2023: Dataset = normalizeDataset(data as DatasetInput);
