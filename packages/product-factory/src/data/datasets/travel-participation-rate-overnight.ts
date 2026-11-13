import data from "../../../../../data/products/packs/datasets/travel-participation-rate-overnight.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 旅行（1泊2日以上）の行動者率（2021）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー travel-participation-rate-overnight)。 */
export const TRAVEL_PARTICIPATION_RATE_OVERNIGHT_2021: Dataset = normalizeDataset(data as DatasetInput);
