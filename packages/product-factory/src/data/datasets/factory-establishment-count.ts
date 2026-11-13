import data from "../../../../../data/products/packs/datasets/factory-establishment-count.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 工場立地件数（2020）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー factory-establishment-count)。 */
export const FACTORY_ESTABLISHMENT_COUNT_2020: Dataset = normalizeDataset(data as DatasetInput);
