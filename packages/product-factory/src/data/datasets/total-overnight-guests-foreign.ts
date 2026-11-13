import data from "../../../../../data/products/packs/datasets/total-overnight-guests-foreign.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 外国人延べ宿泊者数（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー total-overnight-guests-foreign)。 */
export const TOTAL_OVERNIGHT_GUESTS_FOREIGN_2024: Dataset = normalizeDataset(data as DatasetInput);
