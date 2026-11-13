import data from "../../../../../data/products/packs/datasets/beef-consumption-expenditure.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 牛肉消費支出額（2024）。47 地域 (都道府県庁所在市) の実データで、P-14「家計・消費」の代表データセット。記録の正本は台帳 `products.pack-datasets` (キー beef-consumption-expenditure)。 */
export const BEEF_CONSUMPTION_EXPENDITURE_2024: Dataset = normalizeDataset(data as DatasetInput);
