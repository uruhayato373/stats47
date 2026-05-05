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
        govOrg: input.govOrg,
        statsField: input.statsField,
        cycle: input.cycle,
        surveyDate: input.surveyDate,
        categoryKey: input.categoryKey,
        classInf: input.classInf,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        status: "registered",
      })
      .onConflictDoUpdate({
        target: estatMetainfo.statsDataId,
        set: {
          statName: sql`excluded.stat_name`,
          title: sql`excluded.title`,
          areaType: sql`excluded.area_type`,
          description: sql`excluded.description`,
          itemNamePrefix: sql`COALESCE(excluded.item_name_prefix, ${estatMetainfo.itemNamePrefix})`,
          memo: sql`COALESCE(excluded.memo, ${estatMetainfo.memo})`,
          categoryFilters: sql`COALESCE(excluded.category_filters, ${estatMetainfo.categoryFilters})`,
          govOrg: sql`COALESCE(excluded.gov_org, ${estatMetainfo.govOrg})`,
          statsField: sql`COALESCE(excluded.stats_field, ${estatMetainfo.statsField})`,
          cycle: sql`COALESCE(excluded.cycle, ${estatMetainfo.cycle})`,
          surveyDate: sql`COALESCE(excluded.survey_date, ${estatMetainfo.surveyDate})`,
          categoryKey: sql`COALESCE(excluded.category_key, ${estatMetainfo.categoryKey})`,
          classInf: sql`COALESCE(excluded.class_inf, ${estatMetainfo.classInf})`,
          updatedAt: sql`excluded.updated_at`,
          status: sql`'registered'`,
          isActive: sql`1`,
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
