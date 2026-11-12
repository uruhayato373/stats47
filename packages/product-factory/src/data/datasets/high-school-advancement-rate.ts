import data from "../../../../../data/products/packs/datasets/high-school-advancement-rate.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 高等学校卒業者の進学率（2023）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー high-school-advancement-rate)。 */
export const HIGH_SCHOOL_ADVANCEMENT_RATE_2023: Dataset = normalizeDataset(data as DatasetInput);
