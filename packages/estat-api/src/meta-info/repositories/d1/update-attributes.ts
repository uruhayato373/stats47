import "server-only";

import { estatMetainfo, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger";
import { eq } from "drizzle-orm";

export interface UpdateMetaInfoAttributesInput {
  statsDataId: string;
  categoryFilters?: string | null;
  itemNamePrefix?: string | null;
  memo?: string | null;
  classInf?: string | null;
}

/**
 * メタ情報の属性を更新（candidate / registered 問わず対象）
 *
 * classInf は /inspect-estat-meta 実行後に候補エントリへ書き戻すために使う。
 */
export async function updateMetaInfoAttributes(
  input: UpdateMetaInfoAttributesInput
): Promise<boolean> {
  const db = getDrizzle();

  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.categoryFilters !== undefined) updateData.categoryFilters = input.categoryFilters;
    if (input.itemNamePrefix !== undefined) updateData.itemNamePrefix = input.itemNamePrefix;
    if (input.memo !== undefined) updateData.memo = input.memo;
    if (input.classInf !== undefined) updateData.classInf = input.classInf;

    await db
      .update(estatMetainfo)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(updateData as any)
      .where(eq(estatMetainfo.statsDataId, input.statsDataId));

    return true;
  } catch (error) {
    logger.error(
      { input, error: error instanceof Error ? error.message : String(error) },
      "updateMetaInfoAttributes: 例外発生"
    );
    return false;
  }
}
