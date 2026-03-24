import "server-only";

import { estatMetainfo, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger";
import { eq } from "drizzle-orm";

/**
 * メタ情報のステータスを更新
 *
 * @param statsDataId - 統計表ID
 * @param isActive - 有効/無効
 * @returns 更新成功フラグ
 */
export async function updateMetaInfoStatus(
  statsDataId: string,
  isActive: boolean
): Promise<boolean> {
  const db = getDrizzle();

  try {
    const result = await db
      .update(estatMetainfo)
      .set({
        isActive: isActive,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(estatMetainfo.statsDataId, statsDataId));

    // D1のupdate結果から変更行数を取得するのはドライバの実装によるが、
    // エラーが出なければ成功とみなす
    return true;
  } catch (error) {
    logger.error(
      {
        statsDataId,
        isActive,
        error: error instanceof Error ? error.message : String(error),
      },
      "updateMetaInfoStatus: 例外発生"
    );
    return false;
  }
}
