import "server-only";

import { estatMetainfo, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger";
import { sql } from "drizzle-orm";
import type { SaveEstatMetaInfoInput } from "../../types";

/**
 * メタ情報を保存または更新
 *
 * @param input - 保存するメタ情報の入力データ
 * @returns 保存成功フラグ
 */
export async function save(
  input: SaveEstatMetaInfoInput
): Promise<boolean> {
  const db = getDrizzle();

  try {
    const now = new Date().toISOString();

    await db.insert(estatMetainfo)
      .values({
        statsDataId: input.statsDataId,
        statName: input.statName,
        title: input.title,
        areaType: input.areaType || "national",
        description: input.description,
        itemNamePrefix: input.itemNamePrefix,
        memo: input.memo,
        categoryFilters: input.categoryFilters,
        createdAt: now,
        updatedAt: now,
        isActive: true, // 新規作成時は有効
      })
      .onConflictDoUpdate({
        target: estatMetainfo.statsDataId,
        set: {
          statName: sql`excluded.stat_name`,
          title: sql`excluded.title`,
          areaType: sql`excluded.area_type`,
          description: sql`excluded.description`,
          // COALESCE(excluded.x, x) は Drizzle では set 句で値を指定しない場合更新されないので、
          // 明示的に更新したい項目のみ指定するか、下記のように記述する。
          // 元のSQLは COALESCE(excluded.prefix, prefix) なので、入力がnullなら元の値を維持、入力があれば更新という意味。
          // しかし insert values には input の値を入れているので excluded には必ず input の値が入る。
          // inputの値が undefined/null の場合、valuesにnullが入る。
          // Drizzleのvalues()でundefinedは無視される挙動ではないので、明示的に sql`` を使う。

          itemNamePrefix: sql`COALESCE(excluded.item_name_prefix, ${estatMetainfo.itemNamePrefix})`,
          memo: sql`COALESCE(excluded.memo, ${estatMetainfo.memo})`,
          categoryFilters: sql`COALESCE(excluded.category_filters, ${estatMetainfo.categoryFilters})`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    return true;
  } catch (error) {
    logger.error(
      {
        statsDataId: input.statsDataId,
        error: error instanceof Error ? error.message : String(error),
      },
      "saveMetaInfo: 例外発生"
    );
    return false;
  }
}
