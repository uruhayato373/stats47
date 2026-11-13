import data from "../../../../../data/products/packs/datasets/total-area-including-northern-territories-and-takeshima.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 総面積（北方地域及び竹島を含む）（2023）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー total-area-including-northern-territories-and-takeshima)。 */
export const TOTAL_AREA_2023: Dataset = normalizeDataset(data as DatasetInput);
