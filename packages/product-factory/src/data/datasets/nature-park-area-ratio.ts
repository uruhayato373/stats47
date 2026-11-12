import data from "../../../../../data/products/packs/datasets/nature-park-area-ratio.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 自然公園面積割合（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー nature-park-area-ratio)。 */
export const NATURE_PARK_AREA_RATIO_2024: Dataset = normalizeDataset(data as DatasetInput);
