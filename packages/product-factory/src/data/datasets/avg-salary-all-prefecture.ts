import data from "../../../../../data/products/packs/datasets/avg-salary-all-prefecture.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 地方公務員 全職種平均給与月額（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー avg-salary-all-prefecture)。 */
export const AVG_SALARY_ALL_PREFECTURE_2024: Dataset = normalizeDataset(data as DatasetInput);
