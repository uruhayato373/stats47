import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import type { PageComponent } from "./load-page-components";

export function pageComponentsKeyPath(pageType: string, pageKey: string): string {
  return `app/page-components/${pageType}/${encodeURIComponent(pageKey)}.json`;
}

/** @deprecated pageComponentsKeyPath を使用してください */
export const PAGE_COMPONENTS_SNAPSHOT_KEY = "app/page-components/all.json";

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
  try {
    const data = await fetchFromR2AsJson<string[]>(
      CITY_CATEGORY_KEYS_SNAPSHOT_KEY,
    );
    return data ?? [];
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "readCityCategoryKeysFromR2: failed",
    );
    return [];
  }
}

/** @deprecated pageComponentsKeyPath を使用してください */
export interface PageComponentsSnapshot {
  generatedAt: string;
  byPage: Record<string, PageComponent[]>;
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

  try {
    const data = await fetchFromR2AsJson<PageComponent[]>(pageComponentsKeyPath(pageType, pageKey));
    if (!data) return [];
    return data;
  } catch (error) {
    logger.error(
      { pageType, pageKey, error: error instanceof Error ? error.message : String(error) },
      "readPageComponentsFromR2: failed",
    );
    return [];
  }
}
