import data from "../../../../../data/products/packs/datasets/physicians-in-medical-facilities-per-100k.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 人口10万人当たり医師数（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー physicians-in-medical-facilities-per-100k)。 */
export const PHYSICIANS_IN_MEDICAL_FACILITIES_PER_100K_2022: Dataset = normalizeDataset(data as DatasetInput);
