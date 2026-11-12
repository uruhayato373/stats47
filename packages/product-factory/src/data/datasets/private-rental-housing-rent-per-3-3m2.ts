import data from "../../../../../data/products/packs/datasets/private-rental-housing-rent-per-3-3m2.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 民営賃貸住宅家賃（3.3m²当たり）（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー private-rental-housing-rent-per-3-3m2)。 */
export const PRIVATE_RENTAL_HOUSING_RENT_PER_3_3M2_2024: Dataset = normalizeDataset(data as DatasetInput);
