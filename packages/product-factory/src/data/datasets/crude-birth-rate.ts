import data from "../../../../../data/products/packs/datasets/crude-birth-rate.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 粗出生率（人口千対）（2023）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー crude-birth-rate)。 */
export const CRUDE_BIRTH_RATE_2023: Dataset = normalizeDataset(data as DatasetInput);
