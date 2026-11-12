import data from "../../../../../data/products/packs/datasets/local-tax-prefecture.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 地方税収額（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー local-tax-prefecture)。 */
export const LOCAL_TAX_PREFECTURE_2022: Dataset = normalizeDataset(data as DatasetInput);
