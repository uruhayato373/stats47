import data from "../../../../../data/products/packs/datasets/consumer-price-difference-index-housing.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 消費者物価地域差指数（住居）（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー consumer-price-difference-index-housing)。 */
export const CONSUMER_PRICE_DIFFERENCE_INDEX_HOUSING_2024: Dataset = normalizeDataset(data as DatasetInput);
