/**
 * Topic カタログのレジストリ — カテゴリ内グループ分類の単一入口。
 *
 * 記録の正本は `data/categories/topics/<categoryKey>.json` (カタログの categories.topics。JSON Schema 付き。
 * 形と解決の規則は Schema の description)。ここは読み込みと型付けだけを持つ。型は `./types.ts`、解決は `./resolve-topic.ts`。
 *
 * ここに登録されたカテゴリだけが exporter でグループ化される。未登録カテゴリは
 * items.json に topic フィールドが焼かれず、UI は従来の平坦テーブルへフォールバックする。
 */
import administrativefinancial from "../../../../data/categories/topics/administrativefinancial.json";
import agriculture from "../../../../data/categories/topics/agriculture.json";
import commercial from "../../../../data/categories/topics/commercial.json";
import construction from "../../../../data/categories/topics/construction.json";
import economy from "../../../../data/categories/topics/economy.json";
import educationsports from "../../../../data/categories/topics/educationsports.json";
import energy from "../../../../data/categories/topics/energy.json";
import ict from "../../../../data/categories/topics/ict.json";
import infrastructure from "../../../../data/categories/topics/infrastructure.json";
import international from "../../../../data/categories/topics/international.json";
import laborwage from "../../../../data/categories/topics/laborwage.json";
import landweather from "../../../../data/categories/topics/landweather.json";
import miningindustry from "../../../../data/categories/topics/miningindustry.json";
import population from "../../../../data/categories/topics/population.json";
import safetyenvironment from "../../../../data/categories/topics/safetyenvironment.json";
import socialsecurity from "../../../../data/categories/topics/socialsecurity.json";
import tourism from "../../../../data/categories/topics/tourism.json";
import type { CategoryTopicCatalog } from "./types";
import type { CategoryKey } from "../types";

/** JSON の schemaVersion を除いた、カタログの本体 (Schema が形を検査する) */
const toCatalog = ({ schemaVersion: _schemaVersion, ...catalog }: { schemaVersion: number }): CategoryTopicCatalog =>
  catalog as unknown as CategoryTopicCatalog;

const CATALOG_LIST: CategoryTopicCatalog[] = [
  administrativefinancial,
  agriculture,
  commercial,
  construction,
  economy,
  educationsports,
  energy,
  ict,
  infrastructure,
  international,
  laborwage,
  landweather,
  miningindustry,
  population,
  safetyenvironment,
  socialsecurity,
  tourism,
].map(toCatalog);

export const CATEGORY_TOPIC_CATALOGS: Partial<
  Record<CategoryKey, CategoryTopicCatalog>
> = Object.fromEntries(
  CATALOG_LIST.map((catalog) => [catalog.categoryKey, catalog]),
) as Partial<Record<CategoryKey, CategoryTopicCatalog>>;

/** 登録済みカタログを配列で返す (validator 用) */
export function listTopicCatalogs(): CategoryTopicCatalog[] {
  return CATALOG_LIST;
}

export { resolveTopicKey } from "./resolve-topic";
export { toTopicResolutionInput } from "./from-metric";
export {
  OTHER_TOPIC_KEY,
  OTHER_TOPIC_LABEL,
  type CategoryTopicCatalog,
  type TopicDef,
  type TopicMatcher,
  type TopicResolutionInput,
} from "./types";
