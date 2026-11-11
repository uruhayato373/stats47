import data from "../../../../../data/products/packs/datasets/manufacturing-establishments.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 製造業事業所数（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー manufacturing-establishments)。 */
export const MANUFACTURING_ESTABLISHMENTS_2024: Dataset = normalizeDataset(data as DatasetInput);
