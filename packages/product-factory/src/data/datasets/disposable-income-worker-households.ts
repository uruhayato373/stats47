import data from "../../../../../data/products/packs/datasets/disposable-income-worker-households.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 可処分所得（二人以上の世帯のうち勤労者世帯）（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー disposable-income-worker-households)。 */
export const DISPOSABLE_INCOME_WORKER_HOUSEHOLDS_2024: Dataset = normalizeDataset(data as DatasetInput);
