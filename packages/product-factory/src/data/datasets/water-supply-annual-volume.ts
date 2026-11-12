import data from "../../../../../data/products/packs/datasets/water-supply-annual-volume.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 上水道年間給水量（2022）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー water-supply-annual-volume)。 */
export const WATER_SUPPLY_ANNUAL_VOLUME_2022: Dataset = normalizeDataset(data as DatasetInput);
