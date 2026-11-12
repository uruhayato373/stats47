import data from "../../../../../data/products/packs/datasets/nursing-welfare-facility-count-per-100k-65plus.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 65歳以上人口10万人当たり介護老人福祉施設数（2023）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー nursing-welfare-facility-count-per-100k-65plus)。 */
export const NURSING_WELFARE_FACILITY_COUNT_PER_100K_65PLUS_2023: Dataset = normalizeDataset(data as DatasetInput);
