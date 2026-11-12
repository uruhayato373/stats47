import data from "../../../../../data/products/packs/datasets/road-length-per-km2.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 可住地面積1km²当たり道路実延長（2023）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー road-length-per-km2)。 */
export const ROAD_LENGTH_PER_KM2_2023: Dataset = normalizeDataset(data as DatasetInput);
