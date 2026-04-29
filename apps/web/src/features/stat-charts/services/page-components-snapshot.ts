import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import type { PageComponent } from "./load-page-components";

export const PAGE_COMPONENTS_SNAPSHOT_KEY = "snapshots/page-components/all.json";

const STALE_AFTER_DAYS = 30;

export interface PageComponentsSnapshot {
  generatedAt: string;
  /** key: `${pageType}|${pageKey}` */
  byPage: Record<string, PageComponent[]>;
}

let cached: PageComponentsSnapshot | null = null;

function compositeKey(pageType: string, pageKey: string): string {
  return `${pageType}|${pageKey}`;
}

function warnIfStale(generatedAt: string): void {
  const ageDays =
    (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { generatedAt, ageDays: Math.round(ageDays) },
      `page-components snapshot が ${STALE_AFTER_DAYS} 日以上古い`,
    );
  }
}

async function loadSnapshot(): Promise<PageComponentsSnapshot> {
  if (cached) return cached;
  const snapshot = await fetchFromR2AsJson<PageComponentsSnapshot>(
    PAGE_COMPONENTS_SNAPSHOT_KEY,
  );
  if (!snapshot) {
    logger.warn(
      { key: PAGE_COMPONENTS_SNAPSHOT_KEY },
      "page-components snapshot が R2 に存在しません。空 Map を返します",
    );
    cached = { generatedAt: new Date(0).toISOString(), byPage: {} };
    return cached;
  }
  warnIfStale(snapshot.generatedAt);
  cached = snapshot;
  return snapshot;
}

/**
 * R2 上の page-components snapshot から (pageType, pageKey) で取得。
 *
 * loadPageComponents (D1) のドロップイン代替。
 * 全 (~604 行 × ~1KB = ~600KB) を 1 fetch で in-memory cache、以後 O(1) lookup。
 *
 * build 時 (NEXT_PHASE=phase-production-build) は [] を返し ISR で初回 fetch。
 */
export async function readPageComponentsFromR2(
  pageType: string,
  pageKey: string,
): Promise<PageComponent[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return [];
  }

  try {
    const snapshot = await loadSnapshot();
    return snapshot.byPage[compositeKey(pageType, pageKey)] ?? [];
  } catch (error) {
    logger.error(
      {
        pageType,
        pageKey,
        error: error instanceof Error ? error.message : String(error),
      },
      "readPageComponentsFromR2: failed",
    );
    return [];
  }
}
