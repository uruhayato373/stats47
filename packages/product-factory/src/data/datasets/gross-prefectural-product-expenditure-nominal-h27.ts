import data from "../../../../../data/products/packs/datasets/gross-prefectural-product-expenditure-nominal-h27.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 県内総生産（名目・支出側・H27年基準）（2020）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー gross-prefectural-product-expenditure-nominal-h27)。 */
export const GROSS_PREFECTURAL_PRODUCT_EXPENDITURE_NOMINAL_H27_2020: Dataset = normalizeDataset(data as DatasetInput);
