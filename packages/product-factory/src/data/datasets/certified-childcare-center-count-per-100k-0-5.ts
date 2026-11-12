import data from "../../../../../data/products/packs/datasets/certified-childcare-center-count-per-100k-0-5.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 0〜5歳人口10万人当たり認定こども園数（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー certified-childcare-center-count-per-100k-0-5)。 */
export const CERTIFIED_CHILDCARE_CENTER_COUNT_PER_100K_0_5_2024: Dataset = normalizeDataset(data as DatasetInput);
