import data from "../../../../../data/products/packs/datasets/per-capita-prefectural-income-h27.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 1人当たり県民所得（H27年基準）（2020）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー per-capita-prefectural-income-h27)。 */
export const PER_CAPITA_PREFECTURAL_INCOME_2020: Dataset = normalizeDataset(data as DatasetInput);
