import data from "../../../../../data/products/packs/datasets/japanese-population.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 日本人人口（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー japanese-population)。 */
export const JAPANESE_POPULATION_2024: Dataset = normalizeDataset(data as DatasetInput);
