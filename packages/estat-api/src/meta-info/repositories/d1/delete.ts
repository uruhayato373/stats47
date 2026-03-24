import "server-only";

import { estatMetainfo, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger";
import { eq } from "drizzle-orm";

/**
 * メタ情報のキャッシュ（D1側の基本情報）を削除
 *
 * @param statsDataId - 統計表ID
 * @returns 削除成功フラグ
 */
export async function deleteMetaInfoCache(statsDataId: string): Promise<boolean> {
  const db = getDrizzle();

  try {
    await db
      .delete(estatMetainfo)
      .where(eq(estatMetainfo.statsDataId, statsDataId));

    return true;
  } catch (error) {
    logger.error(
      {
        statsDataId,
        error: error instanceof Error ? error.message : String(error),
      },
      "deleteMetaInfoCache: キャッシュ削除失敗"
    );
    return false;
  }
}
