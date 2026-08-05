/**
 * Topic カタログのレジストリ — カテゴリ内グループ分類の単一入口。
 *
 * 役割・情報設計上の位置づけは `./README.md` と `./types.ts` を参照。
 *
 * ここに登録されたカテゴリだけが exporter でグループ化される。未登録カテゴリは
 * items.json に topic フィールドが焼かれず、UI は従来の平坦テーブルへフォールバックする。
 */
import { ADMINISTRATIVEFINANCIAL_TOPICS } from "./catalogs/administrativefinancial";
import { AGRICULTURE_TOPICS } from "./catalogs/agriculture";
import { COMMERCIAL_TOPICS } from "./catalogs/commercial";
import { CONSTRUCTION_TOPICS } from "./catalogs/construction";
import { ECONOMY_TOPICS } from "./catalogs/economy";
import { EDUCATIONSPORTS_TOPICS } from "./catalogs/educationsports";
import { ENERGY_TOPICS } from "./catalogs/energy";
import { ICT_TOPICS } from "./catalogs/ict";
import { INFRASTRUCTURE_TOPICS } from "./catalogs/infrastructure";
import { INTERNATIONAL_TOPICS } from "./catalogs/international";
import { LABORWAGE_TOPICS } from "./catalogs/laborwage";
import { LANDWEATHER_TOPICS } from "./catalogs/landweather";
import { MININGINDUSTRY_TOPICS } from "./catalogs/miningindustry";
import { POPULATION_TOPICS } from "./catalogs/population";
import { SAFETYENVIRONMENT_TOPICS } from "./catalogs/safetyenvironment";
import { SOCIALSECURITY_TOPICS } from "./catalogs/socialsecurity";
import { TOURISM_TOPICS } from "./catalogs/tourism";
import type { CategoryTopicCatalog } from "./types";
import type { CategoryKey } from "../types";

const CATALOG_LIST: CategoryTopicCatalog[] = [
  ADMINISTRATIVEFINANCIAL_TOPICS,
  AGRICULTURE_TOPICS,
  COMMERCIAL_TOPICS,
  CONSTRUCTION_TOPICS,
  ECONOMY_TOPICS,
  EDUCATIONSPORTS_TOPICS,
  ENERGY_TOPICS,
  ICT_TOPICS,
  INFRASTRUCTURE_TOPICS,
  INTERNATIONAL_TOPICS,
  LABORWAGE_TOPICS,
  LANDWEATHER_TOPICS,
  MININGINDUSTRY_TOPICS,
  POPULATION_TOPICS,
  SAFETYENVIRONMENT_TOPICS,
  SOCIALSECURITY_TOPICS,
  TOURISM_TOPICS,
];

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
