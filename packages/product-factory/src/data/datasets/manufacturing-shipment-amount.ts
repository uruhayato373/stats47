import data from "../../../../../data/products/packs/datasets/manufacturing-shipment-amount.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 製造品出荷額等（2023）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー manufacturing-shipment-amount)。 */
export const MANUFACTURING_SHIPMENT_AMOUNT_2023: Dataset = normalizeDataset(data as DatasetInput);
