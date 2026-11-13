import data from "../../../../../data/products/packs/datasets/annual-sales-amount-per-establishment.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 1事業所当たり商業年間商品販売額（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー annual-sales-amount-per-establishment)。 */
export const ANNUAL_SALES_AMOUNT_PER_ESTABLISHMENT_2022: Dataset = normalizeDataset(data as DatasetInput);
