import data from "../../../../../data/products/packs/datasets/manufacturing-employees.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 製造業従業者数（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー manufacturing-employees)。 */
export const MANUFACTURING_EMPLOYEES_2024: Dataset = normalizeDataset(data as DatasetInput);
