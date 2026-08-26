import type {
  CategoryRankingItem,
  FeaturedRankingItem,
  RankingItem,
} from "../../types/ranking-item";
import type { RankingItemWithTags } from "../../types/ranking-item-with-tags";
import type { RankingItemsSnapshot } from "../../types/snapshot";

export interface HomeFeaturedSnapshot {
  generatedAt: string;
  count: number;
  items: FeaturedRankingItem[];
}

export interface CategorySourceSurvey {
  id: string;
  name: string;
  itemCount: number;
}

export interface CategoryTopic {
  key: string;
  label: string;
}

export interface CategoryItemsSnapshot {
  generatedAt: string;
  categoryKey: string;
  count: number;
  items: Array<CategoryRankingItem & { areaType: string }>;
  sourceSurveys?: CategorySourceSurvey[];
  topics?: CategoryTopic[];
}

export interface RankingItemSnapshot {
  generatedAt: string;
  item: RankingItem;
}

export interface SurveyItemsSnapshot {
  generatedAt: string;
  surveyId: string;
  count: number;
  items: Array<CategoryRankingItem & { areaType: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
}

function assertGeneratedAt(value: unknown): string {
  const generatedAt = assertString(value, "generatedAt");
  if (!Number.isFinite(Date.parse(generatedAt))) throw new Error("generatedAt must be a valid date");
  return generatedAt;
}

function assertCount(value: unknown, length: number): number {
  if (!Number.isInteger(value) || value !== length) {
    throw new Error("snapshot count must equal items.length");
  }
  return value as number;
}

function assertTags(value: unknown): void {
  if (value === undefined || value === null) return;
  if (!Array.isArray(value) || !value.every(
    (tag) => isRecord(tag) && typeof tag.tagKey === "string" && tag.tagKey.length > 0,
  )) {
    throw new Error("item.tags must contain tagKey objects");
  }
}

export function parseRankingItem(value: unknown): RankingItem {
  if (!isRecord(value)) throw new Error("ranking item must be an object");
  for (const field of [
    "rankingKey", "areaType", "rankingName", "title", "unit", "dataSourceId", "hook",
    "createdAt", "updatedAt",
  ] as const) {
    assertString(value[field], `item.${field}`);
  }
  if (typeof value.isActive !== "boolean") throw new Error("item.isActive must be boolean");
  assertTags(value.tags);
  return value as unknown as RankingItem;
}

function parseCategoryRankingItem(value: unknown): CategoryRankingItem & { areaType: string } {
  if (!isRecord(value)) throw new Error("category ranking item must be an object");
  for (const field of ["rankingKey", "title", "unit", "areaType"] as const) {
    assertString(value[field], `item.${field}`);
  }
  return value as unknown as CategoryRankingItem & { areaType: string };
}

export function parseRankingItemSnapshot(value: unknown): RankingItemSnapshot {
  if (!isRecord(value)) throw new Error("ranking item snapshot must be an object");
  return { generatedAt: assertGeneratedAt(value.generatedAt), item: parseRankingItem(value.item) };
}

export function parseTaggedRankingItemSnapshot(value: unknown): { item: RankingItemWithTags } {
  const snapshot = parseRankingItemSnapshot(value);
  if (!Array.isArray(snapshot.item.tags)) throw new Error("tagged ranking item requires tags");
  return { item: snapshot.item as RankingItemWithTags };
}

export function parseRankingItemsSnapshot(value: unknown): RankingItemsSnapshot {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error("ranking items snapshot is schema-invalid");
  }
  const items = value.items.map(parseRankingItem);
  return {
    generatedAt: assertGeneratedAt(value.generatedAt),
    count: assertCount(value.count, items.length),
    items,
  };
}

export function parseHomeFeaturedSnapshot(value: unknown): HomeFeaturedSnapshot {
  const snapshot = parseRankingItemsSnapshot(value);
  return { ...snapshot, items: snapshot.items as FeaturedRankingItem[] };
}

export function parseCategoryItemsSnapshot(value: unknown): CategoryItemsSnapshot {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error("category items snapshot is schema-invalid");
  }
  const items = value.items.map(parseCategoryRankingItem);
  const sourceSurveys = value.sourceSurveys === undefined ? undefined : parseSourceSurveys(value.sourceSurveys);
  const topics = value.topics === undefined ? undefined : parseTopics(value.topics);
  return {
    generatedAt: assertGeneratedAt(value.generatedAt),
    categoryKey: assertString(value.categoryKey, "categoryKey"),
    count: assertCount(value.count, items.length),
    items,
    ...(sourceSurveys ? { sourceSurveys } : {}),
    ...(topics ? { topics } : {}),
  };
}

export function parseSurveyItemsSnapshot(value: unknown): SurveyItemsSnapshot {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error("survey items snapshot is schema-invalid");
  }
  const items = value.items.map(parseCategoryRankingItem);
  return {
    generatedAt: assertGeneratedAt(value.generatedAt),
    surveyId: assertString(value.surveyId, "surveyId"),
    count: assertCount(value.count, items.length),
    items,
  };
}

function parseSourceSurveys(value: unknown): CategorySourceSurvey[] {
  if (!Array.isArray(value)) throw new Error("sourceSurveys must be an array");
  return value.map((survey, index) => {
    if (!isRecord(survey) || !Number.isInteger(survey.itemCount)) {
      throw new Error(`sourceSurveys[${index}] is schema-invalid`);
    }
    return {
      id: assertString(survey.id, `sourceSurveys[${index}].id`),
      name: assertString(survey.name, `sourceSurveys[${index}].name`),
      itemCount: survey.itemCount as number,
    };
  });
}

function parseTopics(value: unknown): CategoryTopic[] {
  if (!Array.isArray(value)) throw new Error("topics must be an array");
  return value.map((topic, index) => {
    if (!isRecord(topic)) throw new Error(`topics[${index}] must be an object`);
    return {
      key: assertString(topic.key, `topics[${index}].key`),
      label: assertString(topic.label, `topics[${index}].label`),
    };
  });
}
