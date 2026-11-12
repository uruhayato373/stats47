import data from "../../../../../data/products/packs/datasets/childcare-employment-rate.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 育児をしている人の就業率（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー childcare-employment-rate)。 */
export const CHILDCARE_EMPLOYMENT_RATE_2022: Dataset = normalizeDataset(data as DatasetInput);
