import data from "../../../../../data/products/packs/datasets/elementary-school-students-per-teacher.json";
import { normalizeDataset, type Dataset, type DatasetInput } from "../dataset";

/** 小学校教員1人当たり児童数（2024）。47 県の実データ。記録の正本は台帳 `products.pack-datasets` (キー elementary-school-students-per-teacher)。 */
export const ELEMENTARY_SCHOOL_STUDENTS_PER_TEACHER_2024: Dataset = normalizeDataset(data as DatasetInput);
