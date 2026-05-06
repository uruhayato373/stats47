import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import type { PageComponent } from "./load-page-components";

export function pageComponentsKeyPath(pageType: string, pageKey: string): string {
  return `app/page-components/${pageType}/${encodeURIComponent(pageKey)}.json`;
}

const cache = new Map<string, PageComponent[]>();

/** @deprecated pageComponentsKeyPath を使用してください */
export const PAGE_COMPONENTS_SNAPSHOT_KEY = "app/page-components/all.json";

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
 * build 時 (NEXT_PHASE=phase-production-build) は [] を返す。
 */
export async function readPageComponentsFromR2(
  pageType: string,
  pageKey: string,
): Promise<PageComponent[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return [];
  }

  const cacheKey = `${pageType}|${pageKey}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    const data = await fetchFromR2AsJson<PageComponent[]>(pageComponentsKeyPath(pageType, pageKey));
    const result = data ?? [];
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error(
      { pageType, pageKey, error: error instanceof Error ? error.message : String(error) },
      "readPageComponentsFromR2: failed",
    );
    return [];
  }
}
