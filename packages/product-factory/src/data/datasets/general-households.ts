import data from "../../../../../data/products/packs/datasets/general-households.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 一般世帯数（2020）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー general-households)。 */
export const GENERAL_HOUSEHOLDS_2020: Dataset = normalizeDataset(data as DatasetInput);
