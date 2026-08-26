import "server-only";

import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";

import { parseAreaProfileData, type AreaProfileData } from "../types";
import { areaProfileKeyPath } from "../types/snapshot";

/**
 * R2 上の area-profile/{areaCode}.json から取得。
 *
 * 旧: area-profile/all.json (3.8MB) を全件 fetch → areaCode でフィルタ
 * 新: area-profile/{areaCode}.json (~85KB) を 1 fetch → そのまま返す
 *
 * build 時 (NEXT_PHASE=phase-production-build) は null を返す。
 *
 * ※ module-level cache は持たない (.claude/rules/r2-storage-design.md)。唯一の呼び出し元は
 *   getAreaProfileAction で 1 invocation = 1 call のため request 内 dedup は不要。module cache は
 *   warm isolate で R2 push 後の stale を招く (ISR 再生成を無効化) ため撤去。
 */
export async function readAreaProfileFromR2(
  areaCode: string,
): Promise<AreaProfileData | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  const result = await createSnapshotReader({
    key: areaProfileKeyPath(areaCode),
    label: `area-profile:${areaCode}`,
    parse: parseAreaProfileData,
    select: (profile) => profile,
  }).readResult();
  if (result.status === "ok" || result.status === "stale") return result.data;
  if (result.status === "no-data") {
    logger.warn({ areaCode }, "area-profile snapshot が R2 に存在しません");
    return null;
  }
  throw result.error;
}
