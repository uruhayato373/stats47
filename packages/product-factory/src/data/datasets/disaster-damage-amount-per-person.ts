import data from "../../../../../data/products/packs/datasets/disaster-damage-amount-per-person.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 人口1人当たり災害被害額（2023）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー disaster-damage-amount-per-person)。 */
export const DISASTER_DAMAGE_AMOUNT_PER_PERSON_2023: Dataset = normalizeDataset(data as DatasetInput);
