import "server-only";

import { estatMetainfo, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger";
import { eq } from "drizzle-orm";

/**
 * 更新入力の型定義
 */
export interface UpdateMetaInfoAttributesInput {
  statsDataId: string;
  sourceUrl?: string | null;
  categoryFilters?: string | null;
  itemNamePrefix?: string | null;
  memo?: string | null;
}

/**
 * メタ情報の属性（メタデータのメタデータ）を更新
 *
 * @param input - 更新する属性情報
 * @returns 更新成功フラグ
 */
export async function updateMetaInfoAttributes(
  input: UpdateMetaInfoAttributesInput
): Promise<boolean> {
  const db = getDrizzle();

  try {
    // 更新対象のオブジェクトを作成
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.categoryFilters !== undefined) {
      updateData.categoryFilters = input.categoryFilters;
    }

    if (input.itemNamePrefix !== undefined) {
      updateData.itemNamePrefix = input.itemNamePrefix;
    }

    if (input.memo !== undefined) {
      updateData.memo = input.memo;
    }

    await db
      .update(estatMetainfo)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(updateData as any)
      .where(eq(estatMetainfo.statsDataId, input.statsDataId));

    return true;
  } catch (error) {
    logger.error(
      {
        input,
        error: error instanceof Error ? error.message : String(error),
      },
      "updateMetaInfoAttributes: 例外発生"
    );
    return false;
  }
}
