import data from "../../../../../data/products/packs/datasets/annual-sales-amount.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 商業年間商品販売額（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー annual-sales-amount)。 */
export const ANNUAL_SALES_AMOUNT_2022: Dataset = normalizeDataset(data as DatasetInput);
