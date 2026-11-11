import data from "../../../../../data/products/packs/datasets/average-life-expectancy-male.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 平均余命（男・20歳）（2020）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー average-life-expectancy-male)。 */
export const AVERAGE_LIFE_EXPECTANCY_MALE_2020: Dataset = normalizeDataset(data as DatasetInput);
