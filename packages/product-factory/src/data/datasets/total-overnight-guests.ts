import data from "../../../../../data/products/packs/datasets/total-overnight-guests.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 延べ宿泊者数（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー total-overnight-guests)。 */
export const TOTAL_OVERNIGHT_GUESTS_2024: Dataset = normalizeDataset(data as DatasetInput);
