import data from "../../../../../data/products/packs/datasets/consumer-price-difference-index-overall.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 消費者物価地域差指数（総合）（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー consumer-price-difference-index-overall)。 */
export const CONSUMER_PRICE_DIFFERENCE_INDEX_OVERALL_2024: Dataset = normalizeDataset(data as DatasetInput);
