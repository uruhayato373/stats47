import data from "../../../../../data/products/packs/datasets/nurses-per-100k-population.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 人口10万人当たり看護師数（2020）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー nurses-per-100k-population)。 */
export const NURSES_PER_100K_POPULATION_2020: Dataset = normalizeDataset(data as DatasetInput);
