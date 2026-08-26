import "server-only";

import { logger } from "@stats47/logger/server";
import {
  createSnapshotReader,
  type SnapshotReadResult,
} from "@stats47/r2-storage/server";

import { parsePageComponents } from "./page-component-schema";

import type { PageComponent } from "./load-page-components";

export function pageComponentsKeyPath(pageType: string, pageKey: string): string {
  return `app/page-components/${pageType}/${encodeURIComponent(pageKey)}.json`;
}

/**
 * city-category page-components が定義済みの categoryKey 一覧 (小さな index)。
 * cities ページが「どのカテゴリに city-category データがあるか」を判定するために読む。
 * 旧来の all.json モノリス全読み込みを置き換える (export-page-components-snapshot.ts が生成)。
 */
export const CITY_CATEGORY_KEYS_SNAPSHOT_KEY =
  "app/page-components/city-category-keys.json";

/**
 * city-category page-components を持つ categoryKey の配列を取得。
 * 不在/失敗時は [] (cities ページは全カテゴリ表示にフォールバック)。
 * 小さな index なので module cache は持たない (再 push 後の stale 回避)。
 */
export async function readCityCategoryKeysFromR2(): Promise<string[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return [];
  }
  const result = await createSnapshotReader({
    key: CITY_CATEGORY_KEYS_SNAPSHOT_KEY,
    label: "city-category-keys",
    parse: parseStringArray,
    select: (keys) => keys,
  }).readResult();
  return unwrapArrayResult(result);
}

/**
 * R2 上の page-components/{pageType}/{pageKey}.json から取得。
 *
 * 旧: page-components/all.json (全件) → in-memory cache → key で lookup
 * 新: page-components/{pageType}/{pageKey}.json を 1 fetch → そのまま返す
 *
 * module-level cache は持たない (r2-storage-design.md: data reader は module cache 禁止)。
 * 再 push 後の stale を避けるため、キャッシュは Next.js / CDN レイヤに委ねる。
 * build 時 (NEXT_PHASE=phase-production-build) は [] を返す。
 */
export async function readPageComponentsFromR2(
  pageType: string,
  pageKey: string,
): Promise<PageComponent[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return [];
  }

  const result = await createSnapshotReader({
    key: pageComponentsKeyPath(pageType, pageKey),
    label: `page-components:${pageType}:${pageKey}`,
    parse: parsePageComponents,
    select: (components) => components,
  }).readResult();
  return unwrapArrayResult(result);
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error("snapshot must be a string array");
  }
  return value;
}

function unwrapArrayResult<T>(result: SnapshotReadResult<T[]>): T[] {
  if (result.status === "ok" || result.status === "stale") return result.data;
  if (result.status === "no-data") return [];
  logger.error(
    { status: result.status, error: result.error.message },
    "page-components R2 contract failed",
  );
  throw result.error;
}
