import data from "../../../../../data/products/packs/datasets/total-population.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 総人口（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー total-population)。 */
export const TOTAL_POPULATION_2024: Dataset = normalizeDataset(data as DatasetInput);
